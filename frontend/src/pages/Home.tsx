import { Box, Container, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            欢迎使用 SSH Tunnel Manager
          </Typography>
          <Typography variant="body1" align="center" paragraph>
            一个简单易用的 SSH 隧道管理工具，帮助您轻松管理多个 SSH 隧道连接。
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate('/login')}
            >
              登录
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => navigate('/register')}
            >
              注册
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}