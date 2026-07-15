import { query } from '@/lib/db';
import { fetchAndParseFeed, scrapeArticleText, calculateItemHash } from '@/lib/feeds';
import { generateArticle, validateArticle, detectSensitiveness } from '@/lib/ai';
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

// Helper to check if request is authenticated as admin
async function isAdmin(request) {
  const session = request.cookies.get('admin_session')?.value;
  if (!session) return false;
  try {
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    const secret = new TextEncoder().encode(adminPassword);
    await jwtVerify(session, secret);
    return true;
  } catch (error) {
    return false;
  }
}

// Helper to check if request is authenticated as cron
function isCronAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

// Helper to extract image from RSS item
function extractImage(item) {
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }
  // Try media:content
  const mediaContent = item['media:content'] || item['media:group']?.['media:content'];
  if (mediaContent) {
    if (Array.isArray(mediaContent) && mediaContent[0]?.$.url) {
      return mediaContent[0].$.url;
    }
    if (mediaContent.$?.url) {
      return mediaContent.$.url;
    }
  }
  // Check if there is an image tag in content
  const content = item.content || item.summary || '';
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
  const match = content.match(imgRegex);
  if (match) {
    return match[1];
  }
  return null;
}

export async function POST(request) {
  // 1. Authentication
  const authorized = (await isAdmin(request)) || isCronAuthorized(request);
  if (!authorized) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const forceFeedId = searchParams.get('feed_id');

  const now = new Date();

  try {
    // 2. Fetch feeds to process
    let feeds = [];
    if (forceFeedId) {
      const res = await query('SELECT * FROM ai_feeds WHERE id = $1', [forceFeedId]);
      feeds = res.rows;
    } else {
      // Find active feeds
      const res = await query('SELECT * FROM ai_feeds WHERE is_active = true');
      const allActiveFeeds = res.rows;

      // Filter feeds due to run based on schedule_hours and timezone
      for (const feed of allActiveFeeds) {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: feed.timezone || 'America/Araguaina',
          hour: 'numeric',
          minute: 'numeric',
          hour12: false
        });
        const parts = formatter.formatToParts(now);
        const hourVal = parts.find(p => p.type === 'hour')?.value;
        const minuteVal = parts.find(p => p.type === 'minute')?.value;
        
        if (hourVal && minuteVal) {
          const currentFeedMinutes = parseInt(hourVal, 10) * 60 + parseInt(minuteVal, 10);
          const times = (feed.schedule_hours || '08:00, 12:00, 18:00').split(',').map(t => t.trim());
          
          for (const time of times) {
            const timeParts = time.split(':').map(Number);
            if (timeParts.length === 2) {
              const [sHour, sMinute] = timeParts;
              const scheduledMinutes = sHour * 60 + sMinute;
              const diff = currentFeedMinutes - scheduledMinutes;

              // 30 minutes execution window
              if (diff >= 0 && diff < 30) {
                if (!feed.last_run_at) {
                  feeds.push(feed);
                  break;
                }
                const lastRun = new Date(feed.last_run_at);
                const diffMs = now - lastRun;
                const diffMins = diffMs / (1000 * 60);
                if (diffMins > 45) { // prevent double run in same window
                  feeds.push(feed);
                  break;
                }
              }
            }
          }
        }
      }
    }

    if (feeds.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhum feed agendado para rodar agora.' });
    }

    const report = [];

    // 3. Process each feed
    for (const feed of feeds) {
      // Update last run at to prevent parallel duplicate execution
      await query('UPDATE ai_feeds SET last_run_at = $1 WHERE id = $2', [now, feed.id]);

      try {
        console.log(`Iniciando processamento do feed: ${feed.name}`);
        const parsedFeed = await fetchAndParseFeed(feed.url);
        
        // Reset failed runs
        await query('UPDATE ai_feeds SET failed_consecutive_runs = 0 WHERE id = $1', [feed.id]);

        const items = parsedFeed.items || [];
        let processedCount = 0;
        const skipped = [];
        const created = [];
        const errors = [];

        // Keywords list for filtering
        const allowedKeywords = feed.allowed_keywords ? feed.allowed_keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean) : [];
        const blockedKeywords = feed.blocked_keywords ? feed.blocked_keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean) : [];

        for (const item of items) {
          if (processedCount >= (feed.max_items_per_run || 3)) {
            break;
          }

          const guid = item.guid || item.id || item.link;
          const link = item.link;
          const title = item.title || '';
          const summary = item.contentSnippet || item.summary || item.content || '';
          
          const hash = calculateItemHash(title, summary);

          // Check if already processed
          const checkDup = await query(
            `SELECT id FROM ai_processed_items 
             WHERE feed_id = $1 AND (item_guid = $2 OR item_hash = $3 OR item_link = $4)`,
            [feed.id, guid, hash, link]
          );

          if (checkDup.rows.length > 0) {
            continue;
          }

          // Keyword check on title and summary
          const fullSearchText = (title + ' ' + summary).toLowerCase();
          
          // If allowed keywords configured, at least one must match
          if (allowedKeywords.length > 0 && !allowedKeywords.some(kw => fullSearchText.includes(kw))) {
            await query(
              `INSERT INTO ai_processed_items (feed_id, item_guid, item_link, item_hash, status, error_message)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [feed.id, guid, link, hash, 'ignored', 'Descartado: palavras-chave permitidas não encontradas.']
            );
            continue;
          }

          // If blocked keywords configured, none must match
          if (blockedKeywords.some(kw => fullSearchText.includes(kw))) {
            await query(
              `INSERT INTO ai_processed_items (feed_id, item_guid, item_link, item_hash, status, error_message)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [feed.id, guid, link, hash, 'ignored', 'Descartado: contém palavra-chave bloqueada.']
            );
            continue;
          }

          try {
            // Scrape full article body
            console.log(`Raspando conteúdo da URL: ${link}`);
            const scrapedText = await scrapeArticleText(link);
            const contentToUse = scrapedText || summary;

            // Detect sensitiveness
            const sensitiveness = await detectSensitiveness(contentToUse);

            // Generate article with IA
            console.log(`Gerando artigo via IA para: ${title}`);
            const genResult = await generateArticle({
              theme: title,
              category: feed.category || 'Famosos',
              referenceUrl: link,
              focus: 'sensacionalista e envolvente',
              sourceText: contentToUse,
              feedId: feed.id,
              triggerType: 'feed'
            });

            const art = genResult.article;

            // Fact-checking validation
            const validation = await validateArticle(contentToUse, art.content, art.facts_used);

            // Determine status
            // Forced to draft if: Feed mode is draft OR sensitive topic OR validation failed OR image policy manual
            let finalStatus = feed.mode === 'publish' ? 'published' : 'draft';
            let warningMessage = '';

            if (sensitiveness.isSensitive) {
              finalStatus = 'draft';
              warningMessage += `[Sensível: ${sensitiveness.reason}] `;
            }
            if (!validation.isValid) {
              finalStatus = 'draft';
              warningMessage += `[Validação falhou: ${validation.reason}] `;
            }
            if (feed.image_policy === 'approve_manual') {
              finalStatus = 'draft';
              warningMessage += `[Política de imagem requer aprovação manual] `;
            }

            // Image handling based on policy
            let imageUrl = null;
            let imageCredit = null;
            if (feed.image_policy !== 'none') {
              imageUrl = extractImage(item);
              if (imageUrl) {
                imageCredit = feed.name;
              }
            }

            // Save article
            const insertArticle = await query(
              `INSERT INTO articles (title, slug, excerpt, content, seo_title, seo_description, source_name, source_link, image_url, image_credit, category, status, ai_generated, ai_generation_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13) RETURNING id`,
              [
                art.title, 
                art.slug, 
                art.excerpt, 
                art.content, 
                art.seo_title, 
                art.seo_description, 
                art.source_name || feed.name, 
                art.source_link || link, 
                imageUrl, 
                imageCredit, 
                feed.category || art.category || 'Famosos',
                finalStatus,
                genResult.generationId
              ]
            );
            const articleId = insertArticle.rows[0]?.id;

            // Link article to the generation log
            if (genResult.generationId) {
              await query('UPDATE ai_generations SET article_id = $1 WHERE id = $2', [articleId, genResult.generationId]);
            }

            // Mark processed
            await query(
              `INSERT INTO ai_processed_items (feed_id, item_guid, item_link, item_hash, status, article_id, error_message)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [feed.id, guid, link, hash, 'processed', articleId, warningMessage || null]
            );

            created.push(art.title);
            processedCount++;

          } catch (itemErr) {
            console.error(`Erro ao processar item do feed (${title}):`, itemErr);
            errors.push({ title, error: itemErr.message });

            // Mark item as failed
            await query(
              `INSERT INTO ai_processed_items (feed_id, item_guid, item_link, item_hash, status, error_message)
               VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
              [feed.id, guid, link, hash, 'failed', itemErr.message]
            );
          }
        }

        report.push({
          feedName: feed.name,
          status: 'success',
          created,
          errors
        });

      } catch (feedErr) {
        console.error(`Falha ao ler feed ${feed.name}:`, feedErr);
        
        // Increment consecutive failures
        await query(
          `UPDATE ai_feeds 
           SET failed_consecutive_runs = failed_consecutive_runs + 1 
           WHERE id = $1`,
          [feed.id]
        );

        // Fetch feed again to check if we need to pause it
        const checkFeed = await query('SELECT failed_consecutive_runs FROM ai_feeds WHERE id = $1', [feed.id]);
        const consecutive = checkFeed.rows[0]?.failed_consecutive_runs || 0;
        let paused = false;

        if (consecutive >= 5) {
          await query('UPDATE ai_feeds SET is_active = false, failed_consecutive_runs = 0 WHERE id = $1', [feed.id]);
          paused = true;
        }

        report.push({
          feedName: feed.name,
          status: 'failed',
          error: feedErr.message,
          paused
        });
      }
    }

    return NextResponse.json({ success: true, report });

  } catch (error) {
    console.error('Erro geral no Cron:', error);
    return NextResponse.json({ error: 'Erro interno no processamento do cron: ' + error.message }, { status: 500 });
  }
}
