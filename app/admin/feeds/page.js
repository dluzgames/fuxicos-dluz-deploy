'use client';

import { useState, useEffect } from 'react';

export default function FeedsPage() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Famosos');
  const [scheduleHours, setScheduleHours] = useState('08:00, 12:00, 18:00');
  const [timezone, setTimezone] = useState('America/Araguaina');
  const [maxItemsPerRun, setMaxItemsPerRun] = useState(3);
  const [mode, setMode] = useState('draft');
  const [imagePolicy, setImagePolicy] = useState('attach');
  const [isActive, setIsActive] = useState(true);
  const [allowedKeywords, setAllowedKeywords] = useState('');
  const [blockedKeywords, setBlockedKeywords] = useState('');

  // Cron execution states
  const [runningCronId, setRunningCronId] = useState(null);

  // Fetch all feeds
  const fetchFeeds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/feeds');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar feeds.');
      setFeeds(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  // Save (Create or Update) feed
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      name,
      url,
      category,
      schedule_hours: scheduleHours,
      timezone,
      max_items_per_run: parseInt(maxItemsPerRun, 10),
      mode,
      image_policy: imagePolicy,
      is_active: isActive,
      allowed_keywords: allowedKeywords,
      blocked_keywords: blockedKeywords
    };

    try {
      let res;
      if (editingId) {
        res = await fetch('/api/admin/feeds', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload })
        });
      } else {
        res = await fetch('/api/admin/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar feed.');

      setSuccess(editingId ? 'Feed atualizado com sucesso!' : 'Feed cadastrado com sucesso!');
      resetForm();
      fetchFeeds();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete feed
  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este feed? Todas as referências futuras serão removidas.')) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/feeds?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir feed.');

      setSuccess('Feed excluído com sucesso!');
      fetchFeeds();
    } catch (err) {
      setError(err.message);
    }
  };

  // Run feed manually right now
  const handleRunNow = async (id) => {
    setRunningCronId(id);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/cron?feed_id=${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na execução manual.');

      if (data.report && data.report.length > 0) {
        const rep = data.report[0];
        if (rep.status === 'success') {
          const count = rep.created.length;
          setSuccess(`Execução concluída para ${rep.feedName}! ${count} notícias criadas. ${rep.errors.length} falhas.`);
        } else {
          throw new Error(rep.error || 'Execução do feed falhou.');
        }
      } else {
        setSuccess('Feed verificado. Nenhuma notícia nova encontrada.');
      }
      fetchFeeds();
    } catch (err) {
      setError(err.message);
    } finally {
      setRunningCronId(null);
    }
  };

  const handleEdit = (feed) => {
    setEditingId(feed.id);
    setName(feed.name);
    setUrl(feed.url);
    setCategory(feed.category || 'Famosos');
    setScheduleHours(feed.schedule_hours || '08:00, 12:00, 18:00');
    setTimezone(feed.timezone || 'America/Araguaina');
    setMaxItemsPerRun(feed.max_items_per_run || 3);
    setMode(feed.mode || 'draft');
    setImagePolicy(feed.image_policy || 'attach');
    setIsActive(feed.is_active);
    setAllowedKeywords(feed.allowed_keywords || '');
    setBlockedKeywords(feed.blocked_keywords || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setUrl('');
    setCategory('Famosos');
    setScheduleHours('08:00, 12:00, 18:00');
    setTimezone('America/Araguaina');
    setMaxItemsPerRun(3);
    setMode('draft');
    setImagePolicy('attach');
    setIsActive(true);
    setAllowedKeywords('');
    setBlockedKeywords('');
  };

  return (
    <div className="admin-full-container">
      <div className="admin-header-flex">
        <h2>Canais de Feeds RSS/Atom</h2>
        <button className="btn btn-outline" onClick={resetForm}>Novo Feed</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* CRUD Form */}
      <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', marginBottom: '2.5rem', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
          {editingId ? `Editar Feed #${editingId}` : 'Cadastrar Novo Canal de Feed'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label>Nome do Canal *</label>
            <input type="text" className="form-control" placeholder="Ex: G1 Famosos" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Endereço URL do Feed (XML) *</label>
            <input type="url" className="form-control" placeholder="https://g1.globo.com/rss/g1/pop-arte/" value={url} onChange={(e) => setUrl(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Horários de Execução (Separados por vírgula) *</label>
            <input type="text" className="form-control" placeholder="Ex: 08:00, 12:00, 18:00, 22:00" value={scheduleHours} onChange={(e) => setScheduleHours(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Fuso Horário *</label>
            <input type="text" className="form-control" value={timezone} onChange={(e) => setTimezone(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Categoria Padrão</label>
            <input type="text" className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Máx Notícias por Rodada</label>
            <input type="number" className="form-control" min="1" max="10" value={maxItemsPerRun} onChange={(e) => setMaxItemsPerRun(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Modo de Publicação</label>
            <select className="form-control" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="draft">Rascunho (Revisão Obrigatória)</option>
              <option value="publish">Publicação Automática</option>
            </select>
          </div>

          <div className="form-group">
            <label>Direitos Autorais e Imagem</label>
            <select className="form-control" value={imagePolicy} onChange={(e) => setImagePolicy(e.target.value)}>
              <option value="attach">Baixar URL e Anexar Crédito</option>
              <option value="url_only">Apenas salvar link da imagem</option>
              <option value="none">Não salvar imagens</option>
              <option value="approve_manual">Forçar rascunho sem imagem (Revisar)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label>Filtro: Palavras Permitidas (Separadas por vírgula)</label>
            <input type="text" className="form-control" placeholder="Ex: namoro, gravidez, separou" value={allowedKeywords} onChange={(e) => setAllowedKeywords(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Filtro: Palavras Bloqueadas (Separadas por vírgula)</label>
            <input type="text" className="form-control" placeholder="Ex: morreu, falecimento, luto, crime" value={blockedKeywords} onChange={(e) => setBlockedKeywords(e.target.value)} />
          </div>
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>Canal Ativo (IA monitorando)</label>
        </div>

        <button type="submit" className="btn">{editingId ? 'Salvar Edições' : 'Criar Feed'}</button>
        {editingId && <button type="button" className="btn btn-outline" style={{ marginLeft: '1rem' }} onClick={resetForm}>Cancelar</button>}
      </form>

      {/* List of feeds */}
      <h3 style={{ marginBottom: '1rem' }}>Canais Cadastrados</h3>
      {loading ? (
        <div>Carregando canais...</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Feed</th>
              <th>Horários</th>
              <th>Configuração</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {feeds.map((feed) => (
              <tr key={feed.id}>
                <td>{feed.id}</td>
                <td>
                  <strong style={{ display: 'block' }}>{feed.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {feed.url}
                  </span>
                </td>
                <td>
                  <span style={{ display: 'block', fontSize: '0.9rem' }}>{feed.schedule_hours}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{feed.timezone}</span>
                </td>
                <td>
                  <span className="badge badge-published" style={{ background: feed.mode === 'publish' ? '#dcfce7' : '#f1f5f9', color: feed.mode === 'publish' ? '#15803d' : '#475569' }}>
                    {feed.mode === 'publish' ? 'AUTO' : 'RASCUNHO'}
                  </span>
                  <span style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.2rem' }}>Imagens: {feed.image_policy}</span>
                </td>
                <td>
                  <span className="badge" style={{ backgroundColor: feed.is_active ? '#dcfce7' : '#fee2e2', color: feed.is_active ? '#15803d' : '#b91c1c' }}>
                    {feed.is_active ? 'ATIVO' : 'PAUSADO'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      onClick={() => handleRunNow(feed.id)}
                      disabled={runningCronId === feed.id}
                    >
                      {runningCronId === feed.id ? 'Executando...' : 'Executar'}
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', border: '1px solid #475569', color: '#475569' }}
                      onClick={() => handleEdit(feed)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', border: '1px solid #ef4444', color: '#ef4444' }}
                      onClick={() => handleDelete(feed.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {feeds.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>Nenhum canal de feed RSS cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
