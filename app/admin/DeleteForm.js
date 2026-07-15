'use client';

import { deleteArticle } from './agente/actions';

export default function DeleteForm({ id }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (confirm('Deseja deletar esta notícia?')) {
      const res = await deleteArticle(id);
      if (res && !res.success) {
        alert('Erro ao deletar notícia: ' + res.error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'inline' }}>
      <button type="submit" style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}>
        Deletar
      </button>
    </form>
  );
}
