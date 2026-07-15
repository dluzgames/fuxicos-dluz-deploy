export const metadata = {
  title: 'Login Admin | Fuxi Dluz',
};

export default function AdminLogin({ searchParams }) {
  const error = searchParams?.error;

  return (
    <div className="admin-container" style={{ maxWidth: '400px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Acesso Restrito</h2>
      
      {error && (
        <div className="alert alert-error">
          Senha incorreta. Tente novamente.
        </div>
      )}

      <form action="/api/admin/login" method="POST">
        <div className="form-group">
          <label htmlFor="password">Senha de Administrador</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            className="form-control" 
            required 
          />
        </div>
        <button type="submit" className="btn" style={{ width: '100%' }}>Entrar</button>
      </form>
    </div>
  );
}
