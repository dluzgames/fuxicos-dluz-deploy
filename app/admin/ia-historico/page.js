'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function IAHistoricoPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedGenId, setExpandedGenId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ia-historico');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar histórico.');
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const totalCost = history
    .reduce((sum, item) => sum + parseFloat(item.estimated_cost || 0), 0)
    .toFixed(4);

  const totalSuccess = history.filter(h => h.status === 'success').length;
  const totalFailed = history.filter(h => h.status === 'error').length;

  const toggleExpand = (id) => {
    setExpandedGenId(expandedGenId === id ? null : id);
  };

  return (
    <div className="admin-full-container">
      <div className="admin-header-flex">
        <h2>Histórico de Gerações por IA</h2>
        <button className="btn btn-outline" onClick={fetchHistory}>Atualizar Logs</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Custo Estimado Total</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem', display: 'block' }}>${totalCost} USD</span>
        </div>
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Gerações com Sucesso</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#15803d', marginTop: '0.5rem', display: 'block' }}>{totalSuccess}</span>
        </div>
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Falhas</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b91c1c', marginTop: '0.5rem', display: 'block' }}>{totalFailed}</span>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div>Carregando logs...</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Origem</th>
              <th>Status</th>
              <th>Custo</th>
              <th>Tokens</th>
              <th>Notícia Gerada</th>
              <th>Data</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => {
              const facts = item.facts_used ? JSON.parse(item.facts_used) : [];
              const isExpanded = expandedGenId === item.id;

              return (
                <tr key={item.id} style={{ backgroundColor: isExpanded ? '#f8fafc' : 'transparent' }}>
                  <td>{item.id}</td>
                  <td>
                    {item.trigger_type === 'manual' ? (
                      <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>MANUAL</span>
                    ) : (
                      <div>
                        <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', marginRight: '0.5rem' }}>FEED</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.feed_name || 'Desconhecido'}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: item.status === 'success' ? '#dcfce7' : '#fee2e2', color: item.status === 'success' ? '#15803d' : '#b91c1c' }}>
                      {item.status === 'success' ? 'SUCESSO' : 'ERRO'}
                    </span>
                  </td>
                  <td>${parseFloat(item.estimated_cost || 0).toFixed(5)}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {item.status === 'success' ? (
                      <div>
                        Prompt: {item.prompt_tokens}<br />
                        Comp: {item.completion_tokens}
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    {item.article_id ? (
                      <Link href={`/noticia/${item.article_slug}`} target="_blank" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                        {item.article_title}
                      </Link>
                    ) : item.status === 'error' ? (
                      <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.error_log}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum artigo salvo</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(item.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => toggleExpand(item.id)}
                    >
                      {isExpanded ? 'Fechar' : 'Ver Fatos'}
                    </button>
                    {isExpanded && (
                      <div style={{ position: 'absolute', left: '1.5rem', right: '1.5rem', background: '#fff', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '8px', marginTop: '0.5rem', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem' }}>
                          Fatos Curados pela IA (Verificação de Plágio e Alucinação)
                        </h4>
                        {facts.length > 0 ? (
                          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#475569' }}>
                            {facts.map((fact, idx) => (
                              <li key={idx} style={{ marginBottom: '0.3rem' }}>{fact}</li>
                            ))}
                          </ul>
                        ) : item.error_log ? (
                          <div style={{ color: '#ef4444' }}>
                            <strong>Log do Erro:</strong>
                            <pre style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #fee2e2', borderRadius: '4px', marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {item.error_log}
                            </pre>
                          </div>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Nenhum fato registrado.</span>
                        )}
                        {item.source_url && (
                          <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                            <strong>URL da Fonte:</strong>{' '}
                            <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                              {item.source_url}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {history.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>Nenhum registro de geração encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
