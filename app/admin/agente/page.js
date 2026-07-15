'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveArticle } from './actions';

export default function AgenteIAPage() {
  const router = useRouter();

  // Generator inputs
  const [theme, setTheme] = useState('');
  const [category, setCategory] = useState('Famosos');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [focus, setFocus] = useState('sensacionalista e envolvente');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Loading & UI States
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generated Content Editor States
  const [articleData, setArticleData] = useState(null);

  // Trigger manual generation
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!theme) return;

    setGenerating(true);
    setError('');
    setSuccess('');
    setArticleData(null);

    try {
      const response = await fetch('/api/admin/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          category,
          referenceUrl,
          focus,
          additionalNotes
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro desconhecido na geração.');
      }

      setArticleData({
        title: data.article.title || '',
        slug: data.article.slug || '',
        excerpt: data.article.excerpt || '',
        content: data.article.content || '',
        category: data.article.category || category,
        seo_title: data.article.seo_title || '',
        seo_description: data.article.seo_description || '',
        source_name: data.article.source_name || '',
        source_link: data.article.source_link || referenceUrl,
        image_url: '',
        image_credit: '',
        status: 'draft' // default to draft for editing
      });

      setSuccess('Artigo gerado com sucesso! Revise e ajuste as informações abaixo.');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Save generated/edited article to DB
  const handleSave = async (statusOverride) => {
    if (!articleData) return;

    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      ...articleData,
      status: statusOverride || articleData.status
    };

    try {
      const res = await saveArticle(payload);
      if (!res.success) {
        throw new Error(res.error || 'Erro ao salvar artigo.');
      }

      setSuccess('Notícia salva com sucesso!');
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-full-container">
      <div className="admin-header-flex">
        <h2>Gerador de Notícias por IA</h2>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Módulo de Redação Autoral</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Generation Form */}
      <form onSubmit={handleGenerate} style={{ marginBottom: '3rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>1. Configurações de Pauta</h3>
        
        <div className="form-group">
          <label htmlFor="theme">Tema ou Fatos Principais da Notícia *</label>
          <textarea
            id="theme"
            className="form-control"
            rows="3"
            placeholder="Ex: Cantor famoso foi visto almoçando com a ex ontem em SP. Pareciam muito íntimos."
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            required
            disabled={generating}
          ></textarea>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="referenceUrl">URL da Fonte de Referência (Opcional)</label>
            <input
              type="url"
              id="referenceUrl"
              className="form-control"
              placeholder="https://exemplo.com/noticia-original"
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              disabled={generating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Categoria da Notícia</label>
            <select
              id="category"
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={generating}
            >
              <option value="Famosos">Famosos</option>
              <option value="TV">TV</option>
              <option value="Música">Música</option>
              <option value="Celebridades">Celebridades</option>
              <option value="Esportes">Esportes</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="focus">Enfoque e Tom da Redação</label>
            <select
              id="focus"
              className="form-control"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              disabled={generating}
            >
              <option value="sensacionalista e envolvente">Sensacionalista e Envolvente (Fuxi Dluz Style)</option>
              <option value="jornalístico neutro">Jornalístico Neutro</option>
              <option value="divertido e opinativo">Divertido e Opinativo</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="additionalNotes">Instruções adicionais à IA (Opcional)</label>
            <input
              type="text"
              id="additionalNotes"
              className="form-control"
              placeholder="Ex: Enfatize que é a terceira vez que são vistos juntos."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              disabled={generating}
            />
          </div>
        </div>

        <button type="submit" className="btn" disabled={generating}>
          {generating ? 'Gerando artigo com IA...' : 'Gerar Rascunho via IA'}
        </button>
      </form>

      {/* Editor Form (shows after generation succeeds) */}
      {articleData && (
        <div style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '2rem', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            2. Revisão Editorial e Ajustes
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div className="form-group">
              <label htmlFor="edit-title">Título da Notícia</label>
              <input
                type="text"
                id="edit-title"
                className="form-control"
                value={articleData.title}
                onChange={(e) => setArticleData({ ...articleData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-slug">Slug (URL amigável)</label>
              <input
                type="text"
                id="edit-slug"
                className="form-control"
                value={articleData.slug}
                onChange={(e) => setArticleData({ ...articleData, slug: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-category">Categoria</label>
              <input
                type="text"
                id="edit-category"
                className="form-control"
                value={articleData.category}
                onChange={(e) => setArticleData({ ...articleData, category: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-image-url">URL da Imagem de Destaque</label>
              <input
                type="url"
                id="edit-image-url"
                className="form-control"
                placeholder="https://images.unsplash.com/..."
                value={articleData.image_url}
                onChange={(e) => setArticleData({ ...articleData, image_url: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-image-credit">Crédito da Imagem</label>
              <input
                type="text"
                id="edit-image-credit"
                className="form-control"
                value={articleData.image_credit}
                onChange={(e) => setArticleData({ ...articleData, image_credit: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-seo-title">Título SEO</label>
              <input
                type="text"
                id="edit-seo-title"
                className="form-control"
                value={articleData.seo_title}
                onChange={(e) => setArticleData({ ...articleData, seo_title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-source-name">Nome da Fonte</label>
              <input
                type="text"
                id="edit-source-name"
                className="form-control"
                value={articleData.source_name}
                onChange={(e) => setArticleData({ ...articleData, source_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-source-link">Link da Fonte</label>
              <input
                type="url"
                id="edit-source-link"
                className="form-control"
                value={articleData.source_link}
                onChange={(e) => setArticleData({ ...articleData, source_link: e.target.value })}
              />
            </div>

          </div>

          <div className="form-group">
            <label htmlFor="edit-seo-desc">Descrição SEO (Meta Description)</label>
            <input
              type="text"
              id="edit-seo-desc"
              className="form-control"
              value={articleData.seo_description}
              onChange={(e) => setArticleData({ ...articleData, seo_description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-excerpt">Resumo (Exibido na Home)</label>
            <textarea
              id="edit-excerpt"
              className="form-control"
              rows="2"
              value={articleData.excerpt}
              onChange={(e) => setArticleData({ ...articleData, excerpt: e.target.value })}
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="edit-content">Conteúdo HTML do Artigo</label>
            <textarea
              id="edit-content"
              className="form-control"
              rows="12"
              value={articleData.content}
              onChange={(e) => setArticleData({ ...articleData, content: e.target.value })}
              required
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => handleSave('draft')}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar como Rascunho'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => handleSave('published')}
              disabled={saving}
            >
              {saving ? 'Publicando...' : 'Salvar e Publicar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
