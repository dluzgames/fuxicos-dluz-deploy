import { query } from './db';

// Helper to estimate cost based on model (very rough estimations)
function estimateCost(model, promptTokens, completionTokens) {
  const modelLower = (model || '').toLowerCase();
  let promptRate = 0.00015 / 1000; // default gpt-4o-mini rates
  let completionRate = 0.0006 / 1000;
  
  if (modelLower.includes('gpt-4o') && !modelLower.includes('mini')) {
    promptRate = 0.005 / 1000;
    completionRate = 0.015 / 1000;
  } else if (modelLower.includes('claude-3-5-sonnet')) {
    promptRate = 0.003 / 1000;
    completionRate = 0.015 / 1000;
  }
  
  return (promptTokens * promptRate) + (completionTokens * completionRate);
}

// Check daily limit of generated articles
async function isDailyLimitReached() {
  const limit = parseInt(process.env.AI_DAILY_ARTICLE_LIMIT || '20', 10);
  const result = await query(
    `SELECT COUNT(*) FROM ai_generations 
     WHERE created_at >= NOW() - INTERVAL '1 day' 
     AND status = 'success'`
  );
  const count = parseInt(result.rows[0]?.count || '0', 10);
  return count >= limit;
}

// Call OpenAI/compatible API
async function callAI(systemPrompt, userPrompt, jsonFormat = true) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('AI_API_KEY não configurada no ambiente.');
  }

  const provider = process.env.AI_PROVIDER || 'openai';
  let baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  // Strip trailing slash from baseUrl if present
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  const body = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3
  };

  if (jsonFormat) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API de IA (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  if (!choice) {
    throw new Error('Nenhuma resposta retornada pela IA.');
  }

  return {
    content: choice.message.content,
    promptTokens: data.usage?.prompt_tokens || 0,
    completionTokens: data.usage?.completion_tokens || 0,
    model: model
  };
}

/**
 * Detecta se uma notícia contém temas sensíveis
 */
export async function detectSensitiveness(sourceText) {
  const systemPrompt = `Você é um filtro de segurança para um portal de notícias de entretenimento.
Analise o texto fornecido e determine se ele trata de assuntos extremamente sensíveis ou de alto risco jurídico.
Assuntos sensíveis incluem:
1. Morte, falecimento, suicídio ou acidentes fatais.
2. Crimes graves, acusações de estupro, assédio, agressão ou prisões.
3. Processos judiciais graves ou acusações criminais sem julgamento.
4. Saúde grave, doenças terminais, internações em estado crítico.
5. Escândalos envolvendo menores de idade.
6. Rumores graves de traição/difamação que possam gerar processos por danos morais.

Retorne APENAS um objeto JSON válido no formato:
{ "is_sensitive": true/false, "reason": "descrição curta do motivo ou vazio" }`;

  try {
    const result = await callAI(systemPrompt, sourceText, true);
    const parsed = JSON.parse(result.content);
    return {
      isSensitive: !!parsed.is_sensitive,
      reason: parsed.reason || ''
    };
  } catch (error) {
    console.error('Erro ao detectar sensibilidade:', error);
    // Em caso de erro, por segurança, consideramos sensível
    return { isSensitive: true, reason: 'Erro na verificação automática' };
  }
}

/**
 * Valida o artigo gerado confrontando-o com a fonte original
 */
export async function validateArticle(sourceText, generatedText, factsUsed) {
  const systemPrompt = `Você é um editor sênior de jornalismo responsável pela checagem de fatos (fact-checking).
Sua missão é garantir que o artigo gerado pela IA seja 100% fiel à fonte e que NENHUM fato, citação, número, data ou declaração tenha sido inventado ou distorcido (alucinação da IA).

Regras de rejeição:
1. A IA criou citações/falas que não constam na fonte.
2. A IA inventou ou distorceu datas, locais, números ou nomes.
3. A IA transformou suposições ou opiniões em fatos concretos.
4. O artigo copia parágrafos inteiros da fonte (plágio direto).

Retorne APENAS um objeto JSON válido no formato:
{ "is_valid": true/false, "reason": "motivo detalhado se for inválido, ou vazio se for válido" }`;

  const userPrompt = `FONTE ORIGINAL:
${sourceText}

ARTIGO GERADO:
${generatedText}

FATOS DECLARADOS COMO UTILIZADOS:
${JSON.stringify(factsUsed)}`;

  try {
    const result = await callAI(systemPrompt, userPrompt, true);
    const parsed = JSON.parse(result.content);
    return {
      isValid: !!parsed.is_valid,
      reason: parsed.reason || ''
    };
  } catch (error) {
    console.error('Erro na validação do artigo:', error);
    return { isValid: false, reason: 'Falha no processo de validação automática' };
  }
}

/**
 * Gera um artigo completo com metadados estruturados
 */
export async function generateArticle({
  theme,
  category = 'Famosos',
  referenceUrl = '',
  focus = 'jornalístico',
  additionalNotes = '',
  sourceText = '',
  feedId = null,
  triggerType = 'manual'
}) {
  if (await isDailyLimitReached()) {
    throw new Error('Limite diário de gerações de IA atingido.');
  }

  const systemPrompt = `Você é o Agente de IA Editorial do portal "Fuxi Dluz" (fuxicos.dluz.com.br).
Sua missão é redigir uma notícia de entretenimento (celebridades, TV, música, fofocas, reality shows) no estilo do portal: dinâmico, envolvente, editorialmente atraente e premium.

DIRETRIZES DE CONTEÚDO E FORMATO:
1. Escreva de forma fluida, jornalística e natural. Use intertítulos (H2) para organizar a leitura.
2. O corpo do texto (HTML) NÃO deve conter a tag H1 nem o título da matéria. Use apenas parágrafos (<p>) e cabeçalhos secundários (<h2>).
3. Não invente declarações, citações, datas, números ou nomes. Se a fonte for curta, o artigo deve refletir apenas o que é factual.
4. Crie um resumo curto (excerpt) ideal para a homepage.
5. Crie metadados SEO otimizados (seo_title e meta_description) seguindo as boas práticas.
6. A slug deve ser gerada em minúsculas, apenas com letras, números e hífens (ex: "atriz-vista-no-rio").
7. Sugira até 3 links internos fictícios relevantes baseados na categoria (ex: "/noticia/nome-do-slug").
8. Liste explicitamente todos os fatos concretos que você utilizou da fonte para permitir a validação.

Retorne APENAS um objeto JSON válido no formato:
{
  "title": "Título atraente da notícia",
  "slug": "slug-da-noticia",
  "excerpt": "Resumo atraente em duas frases para a homepage",
  "content": "<p>Parágrafo 1...</p><h2>Subtítulo...</h2><p>Parágrafo 2...</p>",
  "category": "Categoria da notícia",
  "seo_title": "Título SEO otimizado",
  "seo_description": "Descrição SEO dentro dos limites de caracteres",
  "image_alt": "Texto alternativo descritivo para a imagem",
  "source_name": "Nome da fonte de referência",
  "source_link": "Link da fonte de referência",
  "internal_links_suggestions": ["/noticia/slug-1", "/noticia/slug-2"],
  "facts_used": ["Fato 1 extraído da fonte", "Fato 2 extraído da fonte"]
}`;

  const userPrompt = `TEMA/CONCEITO: ${theme}
CATEGORIA: ${category}
URL REFERÊNCIA: ${referenceUrl}
ENFOQUE: ${focus}
NOTAS ADICIONAIS: ${additionalNotes}
TEXTO FONTE EXTRAÍDO:
${sourceText}`;

  const startTime = new Date();
  let generationId = null;

  try {
    const result = await callAI(systemPrompt, userPrompt, true);
    const parsed = JSON.parse(result.content);
    
    // Validar formato básico retornado
    if (!parsed.title || !parsed.slug || !parsed.content) {
      throw new Error('A IA não retornou os campos obrigatórios (title, slug, content).');
    }

    const cost = estimateCost(result.model, result.promptTokens, result.completionTokens);

    // Salvar registro de sucesso no banco de dados
    const insertGen = await query(
      `INSERT INTO ai_generations (feed_id, trigger_type, status, prompt_tokens, completion_tokens, estimated_cost, source_url, facts_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [feedId, triggerType, 'success', result.promptTokens, result.completionTokens, cost, referenceUrl || null, JSON.stringify(parsed.facts_used || [])]
    );
    generationId = insertGen.rows[0]?.id;

    return {
      success: true,
      generationId: generationId,
      article: parsed,
      cost: cost
    };

  } catch (error) {
    console.error('Erro na geração com IA:', error);
    
    // Registrar falha no banco de dados
    await query(
      `INSERT INTO ai_generations (feed_id, trigger_type, status, source_url, error_log)
       VALUES ($1, $2, $3, $4, $5)`,
      [feedId, triggerType, 'error', referenceUrl || null, error.message]
    );

    throw error;
  }
}
