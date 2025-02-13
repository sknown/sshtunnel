import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (token && storedUsername) {
      setUsername(storedUsername);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUsername(null);
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SSH Tunnel Manager
          </Typography>
          {location.pathname !== '/login' && location.pathname !== '/register' && (
            username ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography color="inherit">{username}</Typography>
                <Button color="inherit" onClick={handleLogout}>
                  登出
                </Button>
              </Box>
            ) : (
              <Button color="inherit" onClick={() => navigate('/login')}>
                登录
              </Button>
            )
          )}
        </Toolbar>
      </AppBar>
      <Container sx={{ flex: 1, py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}

export default App;
