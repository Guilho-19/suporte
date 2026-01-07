import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, AlertCircle, Clock, Bug, Database, Server, User, Users, X, Sun, Moon, 
  LayoutDashboard, KanbanSquare, TrendingUp, Activity, AlertTriangle, DatabaseZap, 
  Package, Pencil, Trash2, LogOut, Lock, Book, Building2, UserCheck, Hourglass
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, 
  LineChart, Line, 
  BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const API_URL = 'http://192.168.0.75:5000/api/tickets';
const LOGIN_URL = 'http://192.168.0.75:5000/api/login';

const TICKET_TYPES = [
  "LivrosMod3", "SimAdega", "SimCustoTextil", "SIMAgenda", "SIMAlunos", "SIMAtivo", 
  "SIMBackup", "SIMBan", "SIMBeneficiamento", "SIMBiblioteca", "SIMCarteira", 
  "SIMCesta", "SIMCheques", "SIMCIAP", "SIMCMTextil", "SIMCMTextil_TESTE", 
  "SIMComercial", "SIMComercio", "SIMCompra", "SIMCon", "SIMConfeccao", 
  "SIMConsulta", "SIMContabilidade", "SIMContabilSPED", "SIMCrediario", "SIMCRM", 
  "SIMCustos", "SIMDireta", "SIMEst_Pneus", "SIMExporta_SPED", "SIMFabrica", 
  "SIMFactor", "SIMFácilXML", "SIMFatura", "SIMFinanceiro", "SIMFinan", "SIMFios", 
  "SIMFisio", "SIMFluxo", "SIMFolha", "SIMFrente", "SIMInventário", "SIMLivros", 
  "SIMLivrosCTE", "SIMLog", "SIMLoja", "SIMManad", "SIMOrca", "SIMPag", 
  "SIMPagamento", "SIMPCP", "SIMPDV", "SIMPIS_COFINS", "SIMPlanoMestre", 
  "SIMPneus", "SIMProjetos", "SIMRecebimento", "SIMRec", "SIMRecebimento", "SIMReport", "SIMRet", 
  "SIMSIC", "SIMSmartSales", "SIMSPED_ECF", "SIMSPED_Fiscal", "SIMSPED_Reinf", 
  "SIMTecelagem", "SIMTecidos", "SIMTinturaria", "SIMVendas"
].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

// --- LISTA DE MEMBROS DA EQUIPE (Para atribuição de tickets) ---
const TEAM_MEMBERS = [
  "Fabiana",
  "Luiz Carrijo",
  "Henrique",
  "Arthur",
  "Kelvin",
  "Ana",
  "Guilherme"
].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

const PRIORITY_ORDER = {
  'Urgente': 0, 'Alta': 1, 'Média': 2, 'Normal': 3, 'Baixa': 4
};

const PriorityBadge = ({ priority }) => {
  const colors = {
    'Urgente': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-600 dark:text-white dark:border-red-500',
    'Alta': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-600 dark:text-white dark:border-orange-500',
    'Média': 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500 dark:text-gray-900 dark:border-yellow-400',
    'Normal': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-600 dark:text-white dark:border-green-500',
    'Baixa': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-600 dark:text-white dark:border-blue-500',
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${colors[priority] || colors['Baixa']} shadow-sm`}>{priority}</span>;
};

const TypeIcon = ({ type }) => <Package size={14} className="text-blue-500 dark:text-blue-400" />;

// Helper para calcular e formatar o tempo
const getTicketDuration = (ticket) => {
  if (ticket.columnId === 'A Fazer' || ticket.columnId === 'Apoio' || ticket.columnId === 'Transferido') {
    return { text: "Sem Contagem", active: false };
  }

  if (!ticket.createdAt) return { text: "N/A", active: false };

  const start = new Date(ticket.createdAt);
  const end = ticket.finishedAt ? new Date(ticket.finishedAt) : new Date();
  const diffMs = end - start;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return { text: `${days}d ${hours}h`, active: true };
  return { text: `${hours}h`, active: true };
};

const Dashboard = ({ data }) => {
  if (!data || !data.columns) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <Activity className="animate-spin mb-3" size={32} />
        <p>Carregando métricas...</p>
      </div>
    );
  }

  const allTickets = Object.values(data.columns).flatMap(col => col.items || []);
  const totalTickets = allTickets.length;
  
  // Dados para Gráfico de Pizza (Prioridade)
  const byPriority = allTickets.reduce((acc, ticket) => {
    acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
    return acc;
  }, {});
  
  const pieData = [
    { name: 'Urgente', value: byPriority['Urgente'] || 0, color: '#EF4444' },
    { name: 'Alta', value: byPriority['Alta'] || 0, color: '#F97316' },
    { name: 'Média', value: byPriority['Média'] || 0, color: '#EAB308' },
    { name: 'Normal', value: byPriority['Normal'] || 0, color: '#22C55E' },
    { name: 'Baixa', value: byPriority['Baixa'] || 0, color: '#3B82F6' },
  ].filter(item => item.value > 0);

  // Dados para Gráfico de Barras (Por Usuário)
  const byUser = allTickets.reduce((acc, ticket) => {
    const user = ticket.responsible ? ticket.responsible.split(' ')[0] : 'N/A';
    acc[user] = (acc[user] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(byUser)
    .map(([name, tickets]) => ({ name, tickets }))
    .sort((a, b) => b.tickets - a.tickets);

  // --- NOVO CÁLCULO: Dados para Gráfico de Barras (Por Módulo) ---
  const byModule = allTickets.reduce((acc, ticket) => {
    const moduleName = ticket.type || 'N/A';
    acc[moduleName] = (acc[moduleName] || 0) + 1;
    return acc;
  }, {});

  const moduleData = Object.entries(byModule)
    .map(([name, tickets]) => ({ name, tickets }))
    .sort((a, b) => b.tickets - a.tickets)
    .slice(0, 5); // Top 5 Módulos

  const byDate = allTickets.reduce((acc, ticket) => {
    if (!ticket.createdAt) return acc;
    const isoDate = new Date(ticket.createdAt).toISOString().split('T')[0];
    acc[isoDate] = (acc[isoDate] || 0) + 1;
    return acc;
  }, {});

  let lineData = Object.entries(byDate).map(([isoDate, count]) => {
    const [year, month, day] = isoDate.split('-');
    return { 
      date: `${day}/${month}/${year.slice(2)}`,
      originalDate: isoDate,
      count 
    };
  });

  if (lineData.length === 0) {
     lineData = [{ date: 'Hoje', count: totalTickets, originalDate: new Date().toISOString().split('T')[0] }];
  }
  lineData.sort((a, b) => a.originalDate.localeCompare(b.originalDate));

  const urgentCount = byPriority['Urgente'] || 0;
  
  // --- CÁLCULO DO TEMPO MÉDIO DE RESOLUÇÃO (REAL) ---
  let avgResolutionTime = "N/A";
  const finishedTickets = allTickets.filter(t => 
    t.columnId === 'Finalizado' && 
    t.columnId !== 'A Fazer' && 
    t.columnId !== 'Apoio' && 
    t.columnId !== 'Transferido' && 
    t.createdAt && 
    t.finishedAt
  );
  
  if (finishedTickets.length > 0) {
    const totalTimeMs = finishedTickets.reduce((acc, t) => {
      const start = new Date(t.createdAt);
      const end = new Date(t.finishedAt);
      return acc + (end - start);
    }, 0);
    const avgMs = totalTimeMs / finishedTickets.length;
    const hours = Math.floor(avgMs / (1000 * 60 * 60));
    const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
    avgResolutionTime = `${hours}h ${minutes}m`;
  }

  // --- CÁLCULO DE EFICIÊNCIA SEMANAL (REAL) ---
  let weeklyEfficiency = "-";
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const createdLast7Days = allTickets.filter(t => 
    t.createdAt && 
    new Date(t.createdAt) >= oneWeekAgo &&
    t.columnId !== 'Apoio' &&
    t.columnId !== 'Transferido'
  ).length;

  const finishedLast7Days = allTickets.filter(t => 
    t.columnId === 'Finalizado' && 
    t.finishedAt && new Date(t.finishedAt) >= oneWeekAgo
  ).length;

  if (createdLast7Days > 0) {
    weeklyEfficiency = `${Math.round((finishedLast7Days / createdLast7Days) * 100)}%`;
  } else if (finishedLast7Days > 0) {
    weeklyEfficiency = "100%+";
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Tickets</p><p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{totalTickets}</p></div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Activity size={24} /></div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tickets Urgentes</p><p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{urgentCount}</p></div>
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400"><AlertTriangle size={24} /></div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tempo Médio Res.</p><p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{avgResolutionTime}</p></div>
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400"><Clock size={24} /></div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Eficiência Semanal</p><p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{weeklyEfficiency}</p></div>
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400"><TrendingUp size={24} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Distribuição por Prioridade</h3>
          <div className="h-64 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Volume de Tickets (Dia)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} activeDot={{ r: 8 }} name="Tickets" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Gráfico de Barras - Por Usuário */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-64">
             {/* Esquerda: Por Responsável */}
             <div className="w-full h-full">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Tickets por Responsável</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                    <Bar dataKey="tickets" fill="#8884d8" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3B82F6' : '#60A5FA'} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>

             {/* Direita: Por Módulo */}
             <div className="w-full h-full border-l border-gray-200 dark:border-gray-700 pl-6">
                 <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Tickets por Módulo (Top 5)</h3>
                 <ResponsiveContainer width="100%" height="90%">
                  <BarChart layout="vertical" data={moduleData} margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} horizontal={false} />
                    <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={12} width={100} />
                    <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                    <Bar dataKey="tickets" fill="#10B981" radius={[0, 4, 4, 0]}>
                      {moduleData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10B981' : '#34D399'} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const LEGACY_STATUS_MAP = { 'col-1': 'A Fazer', 'col-2': 'Em Análise', 'col-3': 'Em Validação', 'col-4': 'Finalizado' };
const emptyStructure = {
  columns: {
    'A Fazer': { id: 'A Fazer', title: 'A Fazer', color: 'border-t-4 border-t-red-500 dark:bg-red-900/20', items: [] },
    'Em Análise': { id: 'Em Análise', title: 'Em Análise', color: 'border-t-4 border-t-blue-500 dark:bg-blue-900/20', items: [] },
    'Apoio': { id: 'Apoio', title: 'Apoio', color: 'border-t-4 border-t-cyan-500 dark:bg-cyan-900/20', items: [] },
    'Em Validação': { id: 'Em Validação', title: 'Em Validação', color: 'border-t-4 border-t-purple-500 dark:bg-purple-900/20', items: [] },
    'Transferido': { id: 'Transferido', title: 'Transferido', color: 'border-t-4 border-t-orange-500 dark:bg-orange-900/20', items: [] },
    'Finalizado': { id: 'Finalizado', title: 'Finalizado', color: 'border-t-4 border-t-green-500 dark:bg-green-900/20', items: [] },
  },
  columnOrder: ['A Fazer', 'Em Análise', 'Apoio', 'Em Validação', 'Transferido', 'Finalizado'],
};

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const user = await res.json();
        onLogin(user);
      } else {
        setError('Usuário ou senha inválidos.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-96 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-center mb-6"><div className="bg-blue-600 p-3 rounded-full text-white shadow-lg"><Lock size={32} /></div></div>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">Acesso ao Sistema</h2>
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usuário</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border rounded-md px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded-md px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required /></div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-medium">Entrar</button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('ticketUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [data, setData] = useState(emptyStructure);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState('board');
  const [dbStatus, setDbStatus] = useState('disconnected');
  const [isEditing, setIsEditing] = useState(false);
  const [onlyMyTickets, setOnlyMyTickets] = useState(true);
  
  const [newTicket, setNewTicket] = useState({
    id: '', title: '', priority: 'Normal', type: TICKET_TYPES[0], requester: '', responsible: '', columnId: 'A Fazer'
  });
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedSourceCol, setDraggedSourceCol] = useState(null);

  const handleLogin = (loggedInUser) => {
    localStorage.setItem('ticketUser', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('ticketUser');
    setUser(null);
  };

  const canEditTicket = (ticket) => {
    if (!user) return false;
    if (user.role === 'MASTER' || user.role === 'ADMIN') return true;
    return ticket.createdBy === user.id;
  };

  const canDeleteTicket = () => {
    if (!user) return false;
    return user.role === 'MASTER' || user.role === 'ADMIN';
  };

  const canAssignTicket = () => {
    if (!user) return false;
    return user.role === 'MASTER' || user.role === 'ADMIN';
  };

  const sortTicketsByPriority = (items) => {
    return items.sort((a, b) => {
      const pA = PRIORITY_ORDER[a.priority] !== undefined ? PRIORITY_ORDER[a.priority] : 99;
      const pB = PRIORITY_ORDER[b.priority] !== undefined ? PRIORITY_ORDER[b.priority] : 99;
      return pA - pB;
    });
  };

  const fetchTickets = async () => {
    try {
      setDbStatus('loading');
      const response = await fetch(API_URL); 
      if (!response.ok) throw new Error('Falha ao buscar dados');
      const tickets = await response.json();
      const newData = JSON.parse(JSON.stringify(emptyStructure));
      tickets.forEach(ticket => {
        let status = ticket.columnId;
        if (LEGACY_STATUS_MAP[status]) status = LEGACY_STATUS_MAP[status];
        const targetColumn = newData.columns[status] ? status : 'A Fazer';
        newData.columns[targetColumn].items.push({ ...ticket, columnId: targetColumn });
      });
      Object.keys(newData.columns).forEach(colId => {
        newData.columns[colId].items = sortTicketsByPriority(newData.columns[colId].items);
      });
      setData(newData);
      setDbStatus('connected');
    } catch (error) {
      console.error("Erro API:", error);
      setDbStatus('error');
    }
  };

  useEffect(() => {
    if (user) {
      fetchTickets();
      const interval = setInterval(fetchTickets, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const filteredData = React.useMemo(() => {
    let filtered = JSON.parse(JSON.stringify(data)); 
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        Object.keys(filtered.columns).forEach(key => {
            filtered.columns[key].items = filtered.columns[key].items.filter(item => 
                item.id.toLowerCase().includes(lowerTerm) ||
                item.title.toLowerCase().includes(lowerTerm) ||
                item.requester.toLowerCase().includes(lowerTerm) ||
                (item.responsible && item.responsible.toLowerCase().includes(lowerTerm)) ||
                item.type.toLowerCase().includes(lowerTerm)
            );
        });
    }
    if (onlyMyTickets) {
        Object.keys(filtered.columns).forEach(key => {
            filtered.columns[key].items = filtered.columns[key].items.filter(item => 
                item.createdBy === user.id
            );
        });
    }
    return filtered;
  }, [data, searchTerm, onlyMyTickets, user?.id]);

  const handleDragStart = (e, item, colId) => {
    if (!canEditTicket(item)) { e.preventDefault(); return; }
    setDraggedItem(item);
    setDraggedSourceCol(colId);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.4';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDraggedSourceCol(null);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e, destColId) => {
    e.preventDefault();
    if (!draggedItem || !draggedSourceCol || draggedSourceCol === destColId) return;
    if (!canEditTicket(draggedItem)) { alert("Você não tem permissão para mover este ticket."); return; }

    const previousData = JSON.parse(JSON.stringify(data));
    const sourceColumn = data.columns[draggedSourceCol];
    const destColumn = data.columns[destColId];
    const sourceItems = [...sourceColumn.items];
    const itemIndex = sourceItems.findIndex(i => i.id === draggedItem.id);
    sourceItems.splice(itemIndex, 1);
    const itemMoved = { ...draggedItem, columnId: destColId };
    
    let destItems = [...destColumn.items, itemMoved];
    destItems = sortTicketsByPriority(destItems);

    setData({
      ...data,
      columns: {
        ...data.columns,
        [draggedSourceCol]: { ...sourceColumn, items: sourceItems },
        [destColId]: { ...destColumn, items: destItems },
      },
    });

    try {
      await fetch(`${API_URL}/${draggedItem.id}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: destColId, userId: user.id, userRole: user.role }),
      });
    } catch (error) {
      alert(`Erro ao salvar: ${error.message}`);
      setData(previousData);
    }
  };

  const openNewTicketModal = () => {
    setNewTicket({ id: '', title: '', priority: 'Normal', type: TICKET_TYPES[0], requester: '', responsible: user.username, columnId: 'A Fazer' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (ticket) => {
    if (!canEditTicket(ticket)) return;
    setNewTicket({
      id: ticket.id, title: ticket.title, priority: ticket.priority, 
      type: ticket.type, requester: ticket.requester, responsible: ticket.responsible || '', columnId: ticket.columnId 
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSaveTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.id.trim()) { alert("Digite o número do ticket."); return; }

    const ticketPayload = { ...newTicket, columnId: newTicket.columnId || 'A Fazer', userId: user.id, userRole: user.role };
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_URL}/${newTicket.id}` : API_URL;

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketPayload),
      });
      if (response.ok) {
        fetchTickets();
        setIsModalOpen(false);
      } else {
        const err = await response.json();
        alert(err.message || "Erro ao salvar");
      }
    } catch (error) {
      alert(`Erro de conexão: ${error.message}`);
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir o ticket ${newTicket.id}?`)) return;
    try {
      const response = await fetch(`${API_URL}/${newTicket.id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchTickets();
        setIsModalOpen(false);
      } else {
        alert("Erro ao excluir");
      }
    } catch (error) {
      alert(`Erro de conexão: ${error.message}`);
    }
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-full`}>
      <div className="h-screen overflow-hidden bg-[#F4F5F7] dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-100 flex flex-col transition-colors duration-200">
        
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2 rounded text-white shadow-lg"><Server size={20} /></div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">{user.username} <span className="text-sm font-normal text-gray-500">|</span> Suporte N2</h1>
            </div>
            <nav className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button onClick={() => setCurrentView('board')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'board' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><KanbanSquare size={16} /> Quadro</button>
              <button onClick={() => setCurrentView('dashboard')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'dashboard' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><LayoutDashboard size={16} /> Dashboard</button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setOnlyMyTickets(!onlyMyTickets)}
              className={`p-2 rounded-lg transition-colors ${onlyMyTickets ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              title={onlyMyTickets ? "Visualizando apenas meus tickets" : "Visualizando tickets da equipe"}
            >
              {onlyMyTickets ? <User size={20} /> : <Users size={20} />}
            </button>

            <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Buscar ticket..." className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 lg:w-64 text-sm text-gray-800 dark:text-white placeholder-gray-400 transition-colors" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className={`flex items-center text-xs font-medium gap-1 px-2 py-1 rounded ${dbStatus === 'connected' ? 'text-green-500 bg-green-100' : 'text-red-500 bg-red-100'}`}><DatabaseZap size={14} /> {dbStatus === 'connected' ? 'Online' : 'Offline'}</div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button onClick={openNewTicketModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm"><Plus size={18} /> <span className="hidden sm:inline">Novo</span></button>
            <button onClick={handleLogout} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Sair"><LogOut size={20} /></button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin dark:scrollbar-thumb-gray-600">
          {currentView === 'dashboard' ? <Dashboard data={filteredData} /> : (
            <div className="flex gap-6 min-w-max h-full items-start p-6">
              {data.columnOrder.map((colId) => {
                const column = filteredData.columns[colId];
                return (
                  <div key={colId} className="w-80 flex flex-col bg-gray-100 dark:bg-gray-800/50 rounded-xl max-h-full" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, colId)}>
                    <div className={`p-3 bg-white rounded-t-xl shadow-sm flex items-center justify-between border-b border-gray-100 dark:border-gray-700 ${column.color}`}>
                      <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">{column.title}</h2>
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full font-medium">{column.items.length}</span>
                    </div>
                    <div className="p-2 flex-1 overflow-y-auto min-h-[150px]">
                      {column.items.map((item) => {
                        const isEditable = canEditTicket(item);
                        // Chama o helper para calcular o tempo
                        const durationInfo = getTicketDuration(item);
                        
                        return (
                          <div
                            key={item.id}
                            draggable={isEditable}
                            onDragStart={(e) => handleDragStart(e, item, colId)}
                            onDragEnd={handleDragEnd}
                            onClick={() => openEditModal(item)}
                            className={`bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-3 group relative select-none ${isEditable ? 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-blue-500/20' : 'cursor-default opacity-80'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-mono text-gray-500 dark:text-gray-400 font-medium">{item.id}</span>
                              <PriorityBadge priority={item.priority} />
                            </div>
                            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-3 leading-snug">{item.title}</h3>
                            
                            {/* Layout Atualizado: Rodapé com Módulo à esquerda e Info Stack à direita */}
                            <div className="flex items-end justify-between text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                              {/* Lado Esquerdo: Módulo */}
                              <div className="flex items-center gap-1.5 text-xs" title={`Módulo: ${item.type}`}>
                                <TypeIcon type={item.type} />
                                <span className="truncate max-w-[100px]">{item.type}</span>
                              </div>

                              {/* Lado Direito: Stack de Empresa e Responsável */}
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1 text-xs" title="Empresa">
                                  <span className="truncate max-w-[120px]">{item.requester}</span>
                                  <Building2 size={12} />
                                </div>
                                <div className="flex items-center gap-1 text-xs" title="Responsável">
                                  <span className="truncate max-w-[120px] font-medium text-blue-600 dark:text-blue-400">{item.responsible || 'N/A'}</span>
                                  <UserCheck size={12} />
                                </div>
                              </div>
                            </div>
                            
                            {/* --- Novo Indicador de Tempo com Validação --- */}
                            <div className="mt-2 flex items-center gap-1.5 text-xs">
                                {durationInfo.active ? (
                                    <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                                        <Clock size={10} /> {durationInfo.text}
                                    </span>
                                ) : (
                                    <span className="text-gray-400 flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded">
                                        <Hourglass size={10} /> {durationInfo.text}
                                    </span>
                                )}
                            </div>

                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 dark:bg-gray-700 p-1 rounded">
                               {isEditable ? <Pencil size={12} className="text-gray-500 dark:text-gray-300" /> : <Lock size={12} className="text-red-400" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-3">
                       <button onClick={openNewTicketModal} className="w-full py-1.5 rounded text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 text-sm flex items-center gap-2 px-2 transition-colors"><Plus size={16} /> Adicionar cartão</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all scale-100 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">{isEditing ? `Editar Ticket (${newTicket.id})` : "Novo Ticket N2"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número do Ticket</label>
                  <input type="text" required readOnly={isEditing} className={`w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${isEditing ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`} placeholder="Ex: TCK-1050" value={newTicket.id} onChange={(e) => setNewTicket({...newTicket, id: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título do Problema</label>
                  <input type="text" required className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" placeholder="Ex: Erro ao gerar nota fiscal" value={newTicket.title} onChange={(e) => setNewTicket({...newTicket, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
                    <select className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" value={newTicket.priority} onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}>
                      <option value="Baixa">Baixa</option><option value="Normal">Normal</option><option value="Média">Média</option><option value="Alta">Alta</option><option value="Urgente">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Módulo</label>
                    <select className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" value={newTicket.type} onChange={(e) => setNewTicket({...newTicket, type: e.target.value})}>
                      {TICKET_TYPES.map(type => (<option key={type} value={type}>{type}</option>))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status (Coluna)</label>
                    <select 
                        className={`w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${!canAssignTicket() ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                        value={newTicket.columnId} 
                        onChange={(e) => setNewTicket({...newTicket, columnId: e.target.value})}
                        disabled={!canAssignTicket()} // Bloqueia se não for ADMIN/MASTER
                    >
                      {data.columnOrder.map(colId => (<option key={colId} value={colId}>{data.columns[colId].title}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
                    <input type="text" required className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" placeholder="" value={newTicket.requester} onChange={(e) => setNewTicket({...newTicket, requester: e.target.value})} />
                  </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsável</label>
                    {canAssignTicket() ? (
                        <select 
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                            value={newTicket.responsible} 
                            onChange={(e) => setNewTicket({...newTicket, responsible: e.target.value})}
                        >
                            <option value="" disabled>Selecione um responsável</option>
                            {TEAM_MEMBERS.map(member => (
                                <option key={member} value={member}>{member}</option>
                            ))}
                             {/* Fallback option in case the current responsible is not in the predefined list, so we don't lose data visually */}
                             {!TEAM_MEMBERS.includes(newTicket.responsible) && newTicket.responsible && (
                                 <option value={newTicket.responsible}>{newTicket.responsible}</option>
                             )}
                        </select>
                    ) : (
                        <input 
                            type="text" 
                            readOnly 
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white opacity-50 cursor-not-allowed bg-gray-100"
                            value={newTicket.responsible} 
                        />
                    )}
                </div>
                <div className="pt-4 flex gap-3 justify-end items-center w-full">
                  {isEditing && canDeleteTicket() && (
                    <button type="button" onClick={handleDeleteTicket} className="mr-auto px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center gap-2 shadow-sm"><Trash2 size={16} /> Excluir</button>
                  )}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors">Cancelar</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm">{isEditing ? "Salvar Alterações" : "Criar Ticket"}</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}