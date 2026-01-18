import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Clock, Users, FileText, Play, Square, Download, Calendar, AlertCircle, CheckCircle, TrendingUp, Coffee, Trash2 } from 'lucide-react';

interface TimeRecord {
  id: string;
  date: string;
  entryTime: string;
  lunchExitTime?: string;
  lunchReturnTime?: string;
  exitTime?: string;
  totalHours?: number;
  overtimeHours?: number;
  lunchDuration?: number;
}

interface TimeClockData {
  employeeName: string;
  records: TimeRecord[];
  currentEntry?: string;
  currentLunchExit?: string;
  currentLunchReturn?: string;
}

type WorkPhase = 'idle' | 'working' | 'lunch' | 'finished';

export default function TimeClockSystem() {
  const [employeeName, setEmployeeName] = useState('');
  const [currentEntry, setCurrentEntry] = useState<Date | null>(null);
  const [currentLunchExit, setCurrentLunchExit] = useState<Date | null>(null);
  const [currentLunchReturn, setCurrentLunchReturn] = useState<Date | null>(null);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [workPhase, setWorkPhase] = useState<WorkPhase>('idle');

  // Formatadores com validação de tipo
  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return '--:--';
    }
    return dateObj.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return '';
    }
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Carregar dados do localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('timeClockData');
    if (savedData) {
      try {
        const data: TimeClockData = JSON.parse(savedData);
        setEmployeeName(data.employeeName || '');
        setRecords(data.records || []);
        
        // Restaurar estado atual
        if (data.currentEntry) {
          const entryDate = new Date(data.currentEntry);
          if (!isNaN(entryDate.getTime())) {
            setCurrentEntry(entryDate);
            
            if (data.currentLunchExit) {
              const lunchExitDate = new Date(data.currentLunchExit);
              if (!isNaN(lunchExitDate.getTime())) {
                setCurrentLunchExit(lunchExitDate);
                setWorkPhase('lunch');
                
                if (data.currentLunchReturn) {
                  const lunchReturnDate = new Date(data.currentLunchReturn);
                  if (!isNaN(lunchReturnDate.getTime())) {
                    setCurrentLunchReturn(lunchReturnDate);
                    setWorkPhase('working');
                  }
                }
              }
            } else {
              setWorkPhase('working');
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        localStorage.removeItem('timeClockData');
      }
    }
  }, []);

  // Salvar dados no localStorage
  const saveData = (name: string, recs: TimeRecord[], entry?: Date, lunchExit?: Date, lunchReturn?: Date) => {
    const dataToSave: TimeClockData = {
      employeeName: name,
      records: recs,
      currentEntry: entry?.toISOString(),
      currentLunchExit: lunchExit?.toISOString(),
      currentLunchReturn: lunchReturn?.toISOString()
    };
    localStorage.setItem('timeClockData', JSON.stringify(dataToSave));
  };

  // Função para limpar todos os dados
  const clearAllData = () => {
    const confirmClear = window.confirm(
      '⚠️ ATENÇÃO!\n\n' +
      'Esta ação irá apagar TODOS os dados do sistema:\n' +
      '- Nome do funcionário\n' +
      '- Todos os registros de ponto\n' +
      '- Registro atual em andamento\n\n' +
      'Deseja realmente limpar todos os dados?'
    );

    if (confirmClear) {
      // Limpar localStorage
      localStorage.removeItem('timeClockData');
      
      // Resetar todos os estados
      setEmployeeName('');
      setCurrentEntry(null);
      setCurrentLunchExit(null);
      setCurrentLunchReturn(null);
      setRecords([]);
      setWorkPhase('idle');
      
      // Confirmar ao usuário
      alert('✅ Todos os dados foram limpos com sucesso!');
    }
  };

  // Registrar entrada
  const handleEntry = () => {
    if (!employeeName.trim()) {
      alert('Por favor, insira seu nome antes de registrar o ponto.');
      return;
    }

    const today = new Date().toDateString();
    const existingRecord = records.find(r => {
      const recordDate = new Date(r.date);
      return recordDate.toDateString() === today;
    });
    
    if (existingRecord) {
      alert('Você já registrou a entrada hoje!');
      return;
    }

    const now = new Date();
    setCurrentEntry(now);
    setWorkPhase('working');
    saveData(employeeName, records, now);
  };

  // Registrar saída para almoço
  const handleLunchExit = () => {
    if (!currentEntry) {
      alert('Você precisa registrar a entrada primeiro!');
      return;
    }

    const now = new Date();
    setCurrentLunchExit(now);
    setWorkPhase('lunch');
    saveData(employeeName, records, currentEntry, now);
  };

  // Registrar retorno do almoço
  const handleLunchReturn = () => {
    if (!currentLunchExit) {
      alert('Você precisa registrar a saída para almoço primeiro!');
      return;
    }

    const now = new Date();
    setCurrentLunchReturn(now);
    setWorkPhase('working');
    saveData(employeeName, records, currentEntry, currentLunchExit, now);
  };

  // Registrar saída final
  const handleExit = () => {
    if (!currentEntry) {
      alert('Você precisa registrar a entrada primeiro!');
      return;
    }

    const exitTime = new Date();
    let totalHours = 0;
    let lunchDuration = 0;

    // Calcular horas trabalhadas
    if (currentLunchExit && currentLunchReturn) {
      // Com intervalo de almoço
      const morningHours = (currentLunchExit.getTime() - currentEntry.getTime()) / (1000 * 60 * 60);
      const afternoonHours = (exitTime.getTime() - currentLunchReturn.getTime()) / (1000 * 60 * 60);
      totalHours = morningHours + afternoonHours;
      lunchDuration = (currentLunchReturn.getTime() - currentLunchExit.getTime()) / (1000 * 60 * 60);
    } else if (currentLunchExit) {
      // Saiu para almoço mas não retornou (erro)
      alert('Você precisa registrar o retorno do almoço primeiro!');
      return;
    } else {
      // Sem intervalo de almoço
      totalHours = (exitTime.getTime() - currentEntry.getTime()) / (1000 * 60 * 60);
    }

    const overtimeHours = Math.max(0, totalHours - 8);

    const newRecord: TimeRecord = {
      id: Date.now().toString(),
      date: currentEntry.toISOString(),
      entryTime: formatTime(currentEntry),
      lunchExitTime: currentLunchExit ? formatTime(currentLunchExit) : undefined,
      lunchReturnTime: currentLunchReturn ? formatTime(currentLunchReturn) : undefined,
      exitTime: formatTime(exitTime),
      totalHours,
      overtimeHours,
      lunchDuration
    };

    // Remover registro do mesmo dia se existir
    const filteredRecords = records.filter(r => {
      const recordDate = new Date(r.date);
      return recordDate.toDateString() !== currentEntry.toDateString();
    });

    const updatedRecords = [newRecord, ...filteredRecords];
    setRecords(updatedRecords);
    
    // Resetar estado
    setCurrentEntry(null);
    setCurrentLunchExit(null);
    setCurrentLunchReturn(null);
    setWorkPhase('idle');
    saveData(employeeName, updatedRecords);
  };

  // Calcular totais
  const totalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);
  const totalOvertime = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

  // Exportar para PDF
  const exportToPDF = () => {
    if (records.length === 0) {
      alert('Não há registros para exportar!');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Não foi possível abrir a janela de impressão!');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Ponto</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #333; }
          .info { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>RELATÓRIO DE PONTO ELETRÔNICO</h1>
        <div class="info">
          <p><strong>Funcionário:</strong> ${employeeName || 'Não informado'}</p>
          <p><strong>Data de Emissão:</strong> ${formatDate(new Date())}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Entrada</th>
              <th>Saída Almoço</th>
              <th>Retorno</th>
              <th>Saída</th>
              <th>Total</th>
              <th>Extra</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(record => `
              <tr>
                <td>${formatDate(record.date)}</td>
                <td>${record.entryTime}</td>
                <td>${record.lunchExitTime || '--'}</td>
                <td>${record.lunchReturnTime || '--'}</td>
                <td>${record.exitTime || '--'}</td>
                <td>${record.totalHours?.toFixed(2) || '--'}h</td>
                <td>${record.overtimeHours?.toFixed(2) || '--'}h</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="5">TOTAL</td>
              <td>${totalHours.toFixed(2)}h</td>
              <td>${totalOvertime.toFixed(2)}h</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Tempo trabalhado atual
  const getCurrentWorkTime = () => {
    if (!currentEntry) return '--:--';
    
    let totalTime = 0;
    const now = new Date();
    
    if (currentLunchExit && !currentLunchReturn) {
      // Está no almoço
      totalTime = currentLunchExit.getTime() - currentEntry.getTime();
    } else if (currentLunchReturn) {
      // Retornou do almoço
      totalTime = (currentLunchExit!.getTime() - currentEntry.getTime()) + (now.getTime() - currentLunchReturn.getTime());
    } else {
      // Ainda não saiu para almoço
      totalTime = now.getTime() - currentEntry.getTime();
    }
    
    const hours = Math.floor(totalTime / (1000 * 60 * 60));
    const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Status atual
  const getStatusMessage = () => {
    switch (workPhase) {
      case 'working':
        return currentLunchReturn ? 'Trabalhando (período da tarde)' : 'Trabalhando (período da manhã)';
      case 'lunch':
        return 'Em horário de almoço';
      case 'finished':
        return 'Dia concluído';
      default:
        return 'Aguardando registro';
    }
  };

  const getStatusColor = () => {
    switch (workPhase) {
      case 'working':
        return 'bg-green-50 border-green-500';
      case 'lunch':
        return 'bg-orange-50 border-orange-500';
      case 'finished':
        return 'bg-blue-50 border-blue-500';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Sistema de Ponto Eletrônico</h1>
          <p className="text-gray-600">Registre suas horas de trabalho com intervalo de almoço</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Card de Registro */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Registro de Ponto
              </CardTitle>
              <CardDescription className="text-blue-100">
                Registre os quatro pontos do seu expediente
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employeeName">Nome do Funcionário</Label>
                  <Input
                    id="employeeName"
                    value={employeeName}
                    onChange={(e) => {
                      setEmployeeName(e.target.value);
                      saveData(e.target.value, records, currentEntry, currentLunchExit, currentLunchReturn);
                    }}
                    placeholder="Digite seu nome completo"
                    className="mt-1"
                  />
                </div>

                {/* Display dos tempos */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg border-2 bg-gray-50 border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Entrada</p>
                    <p className="text-xl font-bold">
                      {currentEntry ? formatTime(currentEntry) : '--:--'}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg border-2 bg-gray-50 border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Saída Almoço</p>
                    <p className="text-xl font-bold">
                      {currentLunchExit ? formatTime(currentLunchExit) : '--:--'}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg border-2 bg-gray-50 border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Retorno</p>
                    <p className="text-xl font-bold">
                      {currentLunchReturn ? formatTime(currentLunchReturn) : '--:--'}
                    </p>
                  </div>
                  <div className={`text-center p-3 rounded-lg border-2 ${getStatusColor()}`}>
                    <p className="text-xs text-gray-600 mb-1">Tempo Trabalhado</p>
                    <p className="text-xl font-bold">
                      {workPhase !== 'idle' ? getCurrentWorkTime() : '--:--'}
                    </p>
                  </div>
                </div>

                {/* Botões de registro */}
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleEntry}
                    disabled={workPhase !== 'idle'}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Entrada
                  </Button>
                  <Button 
                    onClick={handleLunchExit}
                    disabled={workPhase !== 'working' || !!currentLunchReturn}
                    variant="outline"
                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <Coffee className="w-4 h-4 mr-2" />
                    Almoço
                  </Button>
                  <Button 
                    onClick={handleLunchReturn}
                    disabled={workPhase !== 'lunch'}
                    variant="outline"
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Retorno
                  </Button>
                  <Button 
                    onClick={handleExit}
                    disabled={workPhase !== 'working' || !currentLunchReturn}
                    variant="destructive"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Saída
                  </Button>
                </div>

                {/* Status atual */}
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                  workPhase === 'working' ? 'bg-green-50 border-green-200' :
                  workPhase === 'lunch' ? 'bg-orange-50 border-orange-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  {workPhase === 'working' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : workPhase === 'lunch' ? (
                    <Coffee className="w-5 h-5 text-orange-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-600" />
                  )}
                  <span className={
                    workPhase === 'working' ? 'text-green-800' :
                    workPhase === 'lunch' ? 'text-orange-800' :
                    'text-gray-800'
                  }>
                    {getStatusMessage()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Resumo */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Resumo do Período
              </CardTitle>
              <CardDescription className="text-purple-100">
                Suas horas trabalhadas e extras
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total de Horas</p>
                  <p className="text-3xl font-bold text-blue-600">{totalHours.toFixed(1)}h</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Horas Extras</p>
                  <p className="text-3xl font-bold text-orange-600">{totalOvertime.toFixed(1)}h</p>
                </div>
              </div>

              <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-1">Total de Dias Registrados</p>
                <p className="text-2xl font-bold text-purple-700">{records.length} dias</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={exportToPDF} className="w-full" disabled={records.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Gerar Relatório
                </Button>
                <Button 
                  onClick={clearAllData} 
                  variant="destructive" 
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Histórico de Registros
            </CardTitle>
            <CardDescription className="text-cyan-100">
              Seus últimos registros de ponto
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {records.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Nenhum registro encontrado</p>
                <p className="text-sm mt-2">Comece registrando seu ponto!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {records.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold">{formatDate(record.date)}</p>
                        <p className="text-sm text-gray-600">
                          {record.entryTime} → {record.lunchExitTime || '--'} → {record.lunchReturnTime || '--'} → {record.exitTime || '--'}
                        </p>
                        {record.lunchDuration && (
                          <p className="text-xs text-orange-600">
                            Intervalo: {record.lunchDuration.toFixed(1)}h
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{record.totalHours?.toFixed(2)}h</p>
                      {record.overtimeHours && record.overtimeHours > 0 && (
                        <p className="text-sm text-orange-600">+{record.overtimeHours.toFixed(2)}h extra</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}