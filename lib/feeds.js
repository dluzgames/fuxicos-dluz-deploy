import dns from 'dns';
import { promisify } from 'util';
import Parser from 'rss-parser';
import { decode } from 'html-entities';
import crypto from 'crypto';

const lookupPromise = promisify(dns.lookup);

/**
 * Valida se uma URL é segura para requisição (proteção contra SSRF)
 */
export async function isSafeUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    // Resolve DNS do hostname
    const { address } = await lookupPromise(parsed.hostname);

    // Se for localhost ou loopback
    if (address === '127.0.0.1' || address === '::1' || parsed.hostname === 'localhost') {
      return false;
    }

    // Se for IP privado IPv4
    // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16
    const parts = address.split('.').map(Number);
    if (parts.length === 4) {
      const [p1, p2] = parts;
      if (p1 === 127 || p1 === 10) return false;
      if (p1 === 172 && (p2 >= 16 && p2 <= 31)) return false;
      if (p1 === 192 && p2 === 168) return false;
      if (p1 === 169 && p2 === 254) return false;
      if (p1 === 0) return false;
    }

    // Se for IPv6 privado/link-local
    if (address.startsWith('fe80:') || address.startsWith('fc00:') || address.startsWith('fd00:')) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Calcula o hash estável de uma notícia para evitar duplicações
 */
export function calculateItemHash(title, content) {
  const data = (title || '') + (content || '');
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Faz o download e parse de um feed RSS/Atom
 */
export async function fetchAndParseFeed(url) {
  if (!(await isSafeUrl(url))) {
    throw new Error('URL do feed insegura ou privada (bloqueada por proteção SSRF).');
  }

  const parser = new Parser({
    headers: {
      'User-Agent': 'FuxiDluz-Bot/1.0 (+https://fuxicos.dluz.com.br)'
    },
    timeout: 8000
  });

  const feed = await parser.parseURL(url);
  return feed;
}

/**
 * Raspa o texto da página da notícia original de forma segura (com timeouts e limites de download)
 */
export async function scrapeArticleText(url) {
  if (!(await isSafeUrl(url))) {
    throw new Error('URL da notícia insegura ou privada (bloqueada por proteção SSRF).');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s de timeout máximo

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FuxiDluz-Bot/1.0 (+https://fuxicos.dluz.com.br)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erro de resposta HTTP (${response.status})`);
    }

    // Lê os dados do stream de forma controlada limitando o tamanho a 500KB
    const reader = response.body.getReader();
    let totalBytes = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.length;
      
      if (totalBytes > 512 * 1024) { // 500KB limit
        controller.abort();
        throw new Error('Conteúdo muito grande. Raspagem abortada.');
      }
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);
    const html = buffer.toString('utf8');

    // Regex simples para capturar texto dentro de parágrafos <p>
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;
    const paragraphs = [];

    while ((match = pRegex.exec(html)) !== null) {
      let pText = match[1]
        .replace(/<[^>]*>/g, '') // Remove tags HTML internas
        .trim();

      pText = decode(pText); // Decodifica entidades HTML como &aacute;

      // Descartar parágrafos muito curtos ou que parecem menus de navegação
      if (pText.length > 40 && !pText.includes('javascript:') && !pText.startsWith('var ')) {
        paragraphs.push(pText);
      }
    }

    // Retorna os parágrafos combinados. Se não encontrar nada, retorna string vazia
    return paragraphs.join('\n\n');
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Erro ao raspar conteúdo em ${url}:`, error.message);
    return ''; // Retorna string vazia para forçar fallback na descrição do feed
  }
}
