import { Box, Typography, Button } from '@mui/material';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  
  let errorMessage = '发生了未知错误';
  let statusCode = 500;
  let errorDetail = '';

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    errorMessage = error.statusText;
    errorDetail = error.data?.message || '';
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorDetail = error.stack || '';
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        bgcolor: '#f5f5f5',
        p: 3,
        textAlign: 'center'
      }}
    >
      <Typography variant="h1" color="error" sx={{ mb: 2 }}>
        {statusCode}
      </Typography>
      <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
        {errorMessage}
      </Typography>
      {errorDetail && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: '600px', wordBreak: 'break-word' }}>
          {errorDetail}
        </Typography>
      )}
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/')}
      >
        返回首页
      </Button>
    </Box>
  );
}