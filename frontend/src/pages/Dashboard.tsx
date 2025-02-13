import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface TunnelConfig {
  id: string;
  name: string;
  localPort: number;
  remoteHost: string;
  remotePort: number;
  sshHost: string;
  sshPort: number;
  sshUsername: string;
  sshPassword: string;
  status: 'connected' | 'disconnected';
  connectedAt?: string;
  bytesReceived?: number;
  bytesSent?: number;
  tags?: string[];
}

export function DashboardPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [tunnels, setTunnels] = useState<TunnelConfig[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTunnel, setNewTunnel] = useState<Omit<TunnelConfig, 'id' | 'status'>>({    
    name: '',
    localPort: 0,
    remoteHost: '',
    remotePort: 0,
    sshHost: '',
    sshPort: 22,
    sshUsername: '',
    sshPassword: '',
    privateKey: ''
  });
  const [editingTunnel, setEditingTunnel] = useState<TunnelConfig | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [connectingTunnelId, setConnectingTunnelId] = useState<string | null>(null);

  const checkAuthAndRedirect = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleUnauthorized = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const handleAddTunnel = async () => {
    if (!checkAuthAndRedirect()) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3000/api/tunnels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newTunnel)
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '添加隧道失败');
      }

      const data = await response.json();
      console.log('获取到的隧道列表数据:', data);
      // 将_id映射到id字段
      const tunnelsWithId = Array.isArray(data) ? data.map(tunnel => ({
        ...tunnel,
        id: tunnel._id
      })) : [];
      setTunnels(tunnelsWithId);
      setOpenDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加隧道时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTunnel = async () => {
    if (!checkAuthAndRedirect() || !editingTunnel) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:3000/api/tunnels/${editingTunnel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: editingTunnel.name,
          localPort: editingTunnel.localPort,
          remoteHost: editingTunnel.remoteHost,
          remotePort: editingTunnel.remotePort,
          sshHost: editingTunnel.sshHost,
          sshPort: editingTunnel.sshPort,
          sshUsername: editingTunnel.sshUsername,
          sshPassword: editingTunnel.sshPassword,
          privateKey: editingTunnel.privateKey,
          privateKeyName: editingTunnel.privateKeyName
        })
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新隧道失败');
      }

      const updatedTunnel = await response.json();
      console.log('更新后的隧道数据:', updatedTunnel);
      // 将_id映射到id字段
      const tunnelWithId = { ...updatedTunnel, id: updatedTunnel._id };
      setTunnels(tunnels.map(t => t.id === editingTunnel.id ? tunnelWithId : t));
      setEditDialogOpen(false);
      setEditingTunnel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新隧道时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTunnel = async (id: string, password?: string) => {
    if (!checkAuthAndRedirect()) return;

    try {
      setLoading(true);
      setError(null);
      const tunnel = tunnels.find(t => t.id === id);
      if (!tunnel) {
        return;
      }

      const action = tunnel.status === 'connected' ? 'disconnect' : 'connect';
      
      // 如果是连接操作且没有保存密码，且没有提供临时密码，则打开密码输入对话框
      if (action === 'connect' && !tunnel.sshPassword && !password) {
        setConnectingTunnelId(id);
        setPasswordDialogOpen(true);
        return;
      }

      const response = await fetch(`http://localhost:3000/api/tunnels/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: password ? JSON.stringify({ tempPassword: password }) : undefined
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(`${action === 'connect' ? '连接' : '断开'}隧道失败`);
      }

      const updatedTunnel = await response.json();
      console.log('切换状态后的隧道数据:', updatedTunnel);
      // 将_id映射到id字段
      const tunnelWithId = { ...updatedTunnel, id: updatedTunnel._id };
      setTunnels(tunnels.map(t => t.id === id ? tunnelWithId : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作隧道时发生错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTunnels = async () => {
      if (!checkAuthAndRedirect()) return;

      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://localhost:3000/api/tunnels', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          throw new Error('获取隧道列表失败');
        }

        const data = await response.json();
        // 将_id映射到id字段
        const tunnelsWithId = Array.isArray(data) ? data.map(tunnel => ({
          ...tunnel,
          id: tunnel._id
        })) : [];
        setTunnels(tunnelsWithId);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取隧道列表时发生错误');
      } finally {
        setLoading(false);
      }
    };

    fetchTunnels();
  }, [navigate]);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          SSH 隧道管理
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setOpenDialog(true)}
          disabled={loading}
        >
          添加新隧道
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3}>
        <List>
          {tunnels.map((tunnel) => (
            <ListItem
              key={tunnel.id}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 2,
                px: 3,
                position: 'relative'
              }}
            >
              <ListItemText
                primary={tunnel.name}
                secondary={`本地端口: ${tunnel.localPort} → ${tunnel.remoteHost}:${tunnel.remotePort} (通过 ${tunnel.sshUsername}@${tunnel.sshHost}:${tunnel.sshPort})`}
                sx={{ mr: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditingTunnel({
                      ...tunnel,
                      privateKeyName: tunnel.privateKeyName || ''
                    });
                    setEditDialogOpen(true);
                  }}
                  disabled={loading || tunnel.status === 'connected'}
                  size="medium"
                >
                  编辑
                </Button>
                <Button
                  variant="contained"
                  color={tunnel.status === 'connected' ? 'error' : 'primary'}
                  onClick={() => handleToggleTunnel(tunnel.id)}
                  disabled={loading}
                  size="medium"
                >
                  {tunnel.status === 'connected' ? '断开' : '连接'}
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>添加新隧道</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="隧道名称"
            fullWidth
            value={newTunnel.name}
            onChange={(e) => setNewTunnel({ ...newTunnel, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="本地端口"
            type="number"
            fullWidth
            value={newTunnel.localPort}
            onChange={(e) => setNewTunnel({ ...newTunnel, localPort: parseInt(e.target.value) })}
          />
          <TextField
            margin="dense"
            label="远程主机"
            fullWidth
            value={newTunnel.remoteHost}
            onChange={(e) => setNewTunnel({ ...newTunnel, remoteHost: e.target.value })}
          />
          <TextField
            margin="dense"
            label="远程端口"
            type="number"
            fullWidth
            value={newTunnel.remotePort}
            onChange={(e) => setNewTunnel({ ...newTunnel, remotePort: parseInt(e.target.value) })}
          />
          <TextField
            margin="dense"
            label="SSH主机"
            fullWidth
            value={newTunnel.sshHost}
            onChange={(e) => setNewTunnel({ ...newTunnel, sshHost: e.target.value })}
          />
          <TextField
            margin="dense"
            label="SSH端口"
            type="number"
            fullWidth
            value={newTunnel.sshPort}
            onChange={(e) => setNewTunnel({ ...newTunnel, sshPort: parseInt(e.target.value) })}
          />
          <TextField
            margin="dense"
            label="SSH用户名"
            fullWidth
            value={newTunnel.sshUsername}
            onChange={(e) => setNewTunnel({ ...newTunnel, sshUsername: e.target.value })}
          />
          <TextField
            margin="dense"
            label="SSH密码"
            type="password"
            fullWidth
            value={newTunnel.sshPassword}
            onChange={(e) => setNewTunnel({ ...newTunnel, sshPassword: e.target.value })}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pem"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const content = e.target?.result as string;
                  setNewTunnel({ ...newTunnel, privateKey: content, privateKeyName: file.name });
                };
                reader.readAsText(file);
              }
            }}
          />
          <Button
            variant="outlined"
            onClick={() => {
                console.log("button click")
                fileInputRef.current?.click()
            }}
            sx={{ mt: 1, mb: 1 }}
            fullWidth
          >
            上传私钥文件 (PEM)
          </Button>
          {newTunnel.privateKey && newTunnel.privateKeyName && (
            <Box sx={{ mt: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                已上传: {newTunnel.privateKeyName}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setNewTunnel({ ...newTunnel, privateKey: '', privateKeyName: '' })}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>取消</Button>
          <Button onClick={handleAddTunnel} variant="contained">
            添加
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => {
        setEditDialogOpen(false);
        setEditingTunnel(null);
      }}>
        <DialogTitle>编辑隧道</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="隧道名称"
            fullWidth
            value={editingTunnel?.name || ''}
            onChange={(e) => setEditingTunnel(prev => prev ? { ...prev, name: e.target.value || '' } : null)}
          />
          <TextField
            margin="dense"
            label="本地端口"
            type="number"
            fullWidth
            value={editingTunnel?.localPort || ''}
            onChange={(e) => setEditingTunnel(prev => prev ? { ...prev, localPort: parseInt(e.target.value) || 0 } : null)}
          />
          <TextField
            margin="dense"
            label="远程主机"
            fullWidth
            value={editingTunnel?.remoteHost || ''}
            onChange={(e) => setEditingTunnel(prev => prev ? { ...prev, remoteHost: e.target.value || '' } : null)}
          />
          <TextField
            margin="dense"
            label="远程端口"
            type="number"
            fullWidth
            value={editingTunnel?.remotePort || ''}
            onChange={(e) => setEditingTunnel(prev => prev ? { ...prev, remotePort: parseInt(e.target.value) || 0 } : null)}
          />
          <TextField
            margin="dense"
            label="SSH主机"
            fullWidth
            value={editingTunnel?.sshHost || ''}
            onChange={(e) => setEditingTunnel(prev => prev ? { ...prev, sshHost: e.target.value || '' } : null)}
          />
          <TextField
            margin="dense"
            label="SSH端口"
            type="number"
            fullWidth
            value={editingTunnel?.sshPort || ''}
            onChange={(e) => setEditingTunnel(prev => prev ? { ...prev, sshPort: parseInt(e.target.value) || 22 } : null)}
          />
          <TextField
            margin="dense"
            label="SSH用户名"
            fullWidth
            value={editingTunnel?.sshUsername || ''}
            onChange={(e) => setEditingTunnel(prev => prev ? { ...prev, sshUsername: e.target.value || '' } : null)}
          />
          <TextField
            margin="dense"
            label="SSH密码"
            type="password"
            fullWidth
            value={editingTunnel?.sshPassword || ''}
            onChange={(e) => setEditingTunnel(prev => prev ? { ...prev, sshPassword: e.target.value || '' } : null)}
          />
          <input
            ref={editFileInputRef}
            type="file"
            accept=".pem"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const content = e.target?.result as string;
                  setEditingTunnel(prev => prev ? { ...prev, privateKey: content, privateKeyName: file.name } : null);
                };
                reader.readAsText(file);
              }
            }}
          />
          <Button
            variant="outlined"
            onClick={() => editFileInputRef.current?.click()}
            sx={{ mt: 1, mb: 1 }}
            fullWidth
          >
            上传私钥文件 (PEM)
          </Button>
          {editingTunnel?.privateKeyName && (
            <Box sx={{ mt: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                已上传: {editingTunnel.privateKeyName}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setEditingTunnel(prev => prev ? { ...prev, privateKey: '', privateKeyName: '' } : null)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            console.log('editingTunnel:', editingTunnel);
            setEditDialogOpen(false);
            setEditingTunnel(null);
          }}>取消</Button>
          <Button onClick={handleEditTunnel} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={passwordDialogOpen} onClose={() => {
        setPasswordDialogOpen(false);
        setConnectingTunnelId(null);
        setTempPassword('');
      }}>
        <DialogTitle>输入SSH密码</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="SSH密码"
            type="password"
            fullWidth
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setPasswordDialogOpen(false);
            setConnectingTunnelId(null);
            setTempPassword('');
          }}>取消</Button>
          <Button onClick={() => {
            if (connectingTunnelId) {
              handleToggleTunnel(connectingTunnelId, tempPassword);
              setPasswordDialogOpen(false);
              setConnectingTunnelId(null);
              setTempPassword('');
            }
          }} variant="contained">
            连接
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}