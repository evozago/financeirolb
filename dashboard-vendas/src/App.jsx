import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Phone, Users, TrendingUp, Calendar, ShoppingCart, DollarSign, MessageCircle, Settings, Save, Plus, Trash2, Search } from 'lucide-react'
import './App.css'
import dadosVendas from './assets/dados_processados.json'

function App() {
  const [vendedoraSelecionada, setVendedoraSelecionada] = useState('')
  const [dadosVendedora, setDadosVendedora] = useState(null)
  const [clientesVisiveis, setClientesVisiveis] = useState(20)
  const [mensagensPersonalizadas, setMensagensPersonalizadas] = useState({})
  const [variaveisPersonalizadas, setVariaveisPersonalizadas] = useState({})
  const [dialogAberto, setDialogAberto] = useState(false)
  const [mensagemTemp, setMensagemTemp] = useState('')
  const [variaveisTempList, setVariaveisTempList] = useState([])
  const [termoPesquisa, setTermoPesquisa] = useState('')

  const vendedoras = Object.keys(dadosVendas)

  // Mensagens padrão para cada vendedora
  const mensagensPadrao = {
    'Jessica Maely Fleury Bueno': 'Oi {cliente}! 😊 Já faz {dias} dias que você não compra com a gente! Vem conferir as novidades incríveis que chegaram! 🛍️✨',
    'Micaelly dos Santos Silva': 'Olá {cliente}! 💕 Sentimos sua falta! Faz {dias} dias que você não aparece aqui. Temos muitas novidades esperando por você! 🌟',
    'Julia Carolina Santiago Almeida': 'Oi querida {cliente}! 🥰 Já se passaram {dias} dias desde sua última compra. Que tal dar uma olhadinha nas nossas novidades? 💖',
    'Maria Julia Gomes Freitas Silva': 'Olá {cliente}! 🌸 Faz {dias} dias que você não vem nos visitar! Temos peças lindas que você vai amar! Vem conferir! ✨'
  }

  // Variáveis padrão do sistema
  const variaveisPadrao = [
    { nome: 'cliente', valor: 'Nome do cliente', fixo: true },
    { nome: 'dias', valor: 'Dias desde a última compra', fixo: true }
  ]

  useEffect(() => {
    // Carregar mensagens do localStorage ou usar padrão
    const mensagensSalvas = localStorage.getItem('mensagensWhatsApp')
    if (mensagensSalvas) {
      setMensagensPersonalizadas(JSON.parse(mensagensSalvas))
    } else {
      setMensagensPersonalizadas(mensagensPadrao)
    }

    // Carregar variáveis personalizadas do localStorage
    const variaveisSalvas = localStorage.getItem('variaveisPersonalizadas')
    if (variaveisSalvas) {
      setVariaveisPersonalizadas(JSON.parse(variaveisSalvas))
    }
  }, [])

  useEffect(() => {
    if (vendedoraSelecionada && dadosVendas[vendedoraSelecionada]) {
      setDadosVendedora(dadosVendas[vendedoraSelecionada])
      setClientesVisiveis(20) // Reset ao trocar vendedora
    }
  }, [vendedoraSelecionada])

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarTelefone = (telefone) => {
    if (!telefone || telefone === 'Não encontrado') return telefone
    const tel = telefone.toString()
    return `(${tel.slice(0, 2)}) ${tel.slice(2, 7)}-${tel.slice(7)}`
  }

  const calcularDiasUltimaCompra = (dataUltimaCompra) => {
    const hoje = new Date()
    const ultimaCompra = new Date(dataUltimaCompra.split('/').reverse().join('-'))
    const diffTime = Math.abs(hoje - ultimaCompra)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const obterVariaveisVendedora = (vendedora) => {
    const variaveisVendedora = variaveisPersonalizadas[vendedora] || []
    return [...variaveisPadrao, ...variaveisVendedora]
  }

  const gerarLinkWhatsApp = (cliente) => {
    const vendedora = dadosVendedora.vendedor
    const telefoneCliente = cliente.telefone_cliente ? cliente.telefone_cliente.replace(/\D/g, '') : ''
    const diasSemComprar = calcularDiasUltimaCompra(cliente.ultima_compra)
    
    // Se não há telefone do cliente, não gerar link
    if (!telefoneCliente || telefoneCliente === 'Não encontrado') {
      return '#'
    }
    
    let mensagem = mensagensPersonalizadas[vendedora] || mensagensPadrao[vendedora]
    
    // Substituir variáveis padrão
    mensagem = mensagem
      .replace(/{cliente}/g, cliente.cliente)
      .replace(/{dias}/g, diasSemComprar)
    
    // Substituir variáveis personalizadas
    const variaveisVendedora = variaveisPersonalizadas[vendedora] || []
    variaveisVendedora.forEach(variavel => {
      const regex = new RegExp(`{${variavel.nome}}`, 'g')
      mensagem = mensagem.replace(regex, variavel.valor)
    })
    
    const mensagemEncoded = encodeURIComponent(mensagem)
    return `https://wa.me/55${telefoneCliente}?text=${mensagemEncoded}`
  }

  const adicionarVariavel = () => {
    setVariaveisTempList([...variaveisTempList, { nome: '', valor: '', fixo: false }])
  }

  const removerVariavel = (index) => {
    const novasVariaveis = variaveisTempList.filter((_, i) => i !== index)
    setVariaveisTempList(novasVariaveis)
  }

  const atualizarVariavel = (index, campo, valor) => {
    const novasVariaveis = [...variaveisTempList]
    novasVariaveis[index][campo] = valor
    setVariaveisTempList(novasVariaveis)
  }

  const salvarMensagemPersonalizada = () => {
    // Salvar mensagem
    const novasMensagens = {
      ...mensagensPersonalizadas,
      [vendedoraSelecionada]: mensagemTemp
    }
    setMensagensPersonalizadas(novasMensagens)
    localStorage.setItem('mensagensWhatsApp', JSON.stringify(novasMensagens))

    // Salvar variáveis personalizadas (apenas as não fixas)
    const variaveisPersonalizadasFiltradas = variaveisTempList.filter(v => !v.fixo && v.nome && v.valor)
    const novasVariaveis = {
      ...variaveisPersonalizadas,
      [vendedoraSelecionada]: variaveisPersonalizadasFiltradas
    }
    setVariaveisPersonalizadas(novasVariaveis)
    localStorage.setItem('variaveisPersonalizadas', JSON.stringify(novasVariaveis))

    setDialogAberto(false)
  }

  const abrirDialogPersonalizacao = () => {
    setMensagemTemp(mensagensPersonalizadas[vendedoraSelecionada] || mensagensPadrao[vendedoraSelecionada])
    
    // Carregar variáveis da vendedora (padrão + personalizadas)
    const variaveisVendedora = obterVariaveisVendedora(vendedoraSelecionada)
    setVariaveisTempList([...variaveisVendedora])
    
    setDialogAberto(true)
  }

  const inserirVariavelNaMensagem = (nomeVariavel) => {
    const textarea = document.querySelector('textarea')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const texto = mensagemTemp
      const novoTexto = texto.substring(0, start) + `{${nomeVariavel}}` + texto.substring(end)
      setMensagemTemp(novoTexto)
      
      // Reposicionar cursor
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + nomeVariavel.length + 2, start + nomeVariavel.length + 2)
      }, 0)
    }
  }

  const carregarMaisClientes = () => {
    setClientesVisiveis(prev => prev + 20)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Dashboard de Vendas
          </h1>
          <p className="text-lg text-gray-600">
            Ranking de clientes por vendedora com WhatsApp personalizado
          </p>
        </div>

        {/* Seletor de Vendedora */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Selecionar Vendedora
            </CardTitle>
            <CardDescription>
              Escolha uma vendedora para visualizar o ranking de seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={vendedoraSelecionada} onValueChange={setVendedoraSelecionada}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Selecione uma vendedora..." />
              </SelectTrigger>
              <SelectContent>
                {vendedoras.map((vendedora) => (
                  <SelectItem key={vendedora} value={vendedora}>
                    {vendedora}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Informações da Vendedora */}
        {dadosVendedora && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Vendedora</p>
                      <p className="text-2xl font-bold">{dadosVendedora.vendedor}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Telefone</p>
                      <p className="text-xl font-bold">{formatarTelefone(dadosVendedora.telefone)}</p>
                    </div>
                    <Phone className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Total de Clientes</p>
                      <p className="text-2xl font-bold">{dadosVendedora.total_clientes.toLocaleString('pt-BR')}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Valor Total</p>
                      <p className="text-xl font-bold">{formatarMoeda(dadosVendedora.valor_total_vendas)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configuração de Mensagem WhatsApp */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Mensagem WhatsApp Personalizada
                </CardTitle>
                <CardDescription>
                  Configure a mensagem e variáveis personalizadas que serão enviadas aos clientes via WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Mensagem atual:</p>
                      <p className="text-gray-800">
                        {mensagensPersonalizadas[vendedoraSelecionada] || mensagensPadrao[vendedoraSelecionada]}
                      </p>
                    </div>
                    <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                      <DialogTrigger asChild>
                        <Button onClick={abrirDialogPersonalizacao} variant="outline" size="lg">
                          <Settings className="h-4 w-4 mr-2" />
                          Personalizar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Personalizar Mensagem WhatsApp</DialogTitle>
                          <DialogDescription>
                            Edite a mensagem e configure variáveis personalizadas para {vendedoraSelecionada}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                          {/* Seção de Variáveis */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">Variáveis Disponíveis</h4>
                              <Button onClick={adicionarVariavel} size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Variável
                              </Button>
                            </div>
                            
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                              {variaveisTempList.map((variavel, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs">Nome da Variável</Label>
                                      <Input
                                        value={variavel.nome}
                                        onChange={(e) => atualizarVariavel(index, 'nome', e.target.value)}
                                        placeholder="ex: loja"
                                        disabled={variavel.fixo}
                                        className="h-8"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Valor</Label>
                                      <Input
                                        value={variavel.valor}
                                        onChange={(e) => atualizarVariavel(index, 'valor', e.target.value)}
                                        placeholder="ex: Minha Loja Fashion"
                                        disabled={variavel.fixo}
                                        className="h-8"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <Button
                                      onClick={() => inserirVariavelNaMensagem(variavel.nome)}
                                      size="sm"
                                      variant="ghost"
                                      disabled={!variavel.nome}
                                      className="h-6 px-2 text-xs"
                                    >
                                      Inserir
                                    </Button>
                                    {!variavel.fixo && (
                                      <Button
                                        onClick={() => removerVariavel(index)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Seção da Mensagem */}
                          <div className="space-y-3">
                            <Label>Mensagem Personalizada</Label>
                            <Textarea
                              value={mensagemTemp}
                              onChange={(e) => setMensagemTemp(e.target.value)}
                              placeholder="Digite sua mensagem personalizada..."
                              className="min-h-[120px]"
                            />
                            <div className="text-sm text-gray-600">
                              <p><strong>Como usar:</strong></p>
                              <p>• Digite sua mensagem normalmente</p>
                              <p>• Use as variáveis acima clicando em "Inserir" ou digitando {'{nome_da_variavel}'}</p>
                              <p>• As variáveis serão substituídas automaticamente ao enviar</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setDialogAberto(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={salvarMensagemPersonalizada}>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Mostrar variáveis personalizadas da vendedora */}
                  {variaveisPersonalizadas[vendedoraSelecionada] && variaveisPersonalizadas[vendedoraSelecionada].length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-2">Variáveis personalizadas ativas:</p>
                      <div className="flex flex-wrap gap-2">
                        {obterVariaveisVendedora(vendedoraSelecionada).map((variavel, index) => (
                          <Badge key={index} variant={variavel.fixo ? "default" : "secondary"}>
                            {'{' + variavel.nome + '}'}: {variavel.valor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ranking de Clientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Ranking de Clientes por Valor de Compras
                </CardTitle>
                <CardDescription>
                  Top clientes da vendedora {dadosVendedora.vendedor} ordenados por valor total de compras
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Campo de Pesquisa */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Pesquisar cliente por nome..."
                      value={termoPesquisa}
                      onChange={(e) => setTermoPesquisa(e.target.value)}
                      className="pl-10 w-full max-w-md"
                    />
                  </div>
                  {termoPesquisa && (
                    <p className="text-sm text-gray-600 mt-2">
                      Pesquisando por: "{termoPesquisa}"
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  {dadosVendedora.clientes
                    .filter(cliente => 
                      cliente.cliente.toLowerCase().includes(termoPesquisa.toLowerCase())
                    )
                    .slice(0, clientesVisiveis)
                    .map((cliente, index) => {
                    const diasSemComprar = calcularDiasUltimaCompra(cliente.ultima_compra)
                    return (
                      <div
                        key={cliente.ranking}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-amber-600' :
                            'bg-blue-500'
                          }`}>
                            {cliente.ranking}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{cliente.cliente}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Cliente desde: {cliente.cliente_desde}
                              </span>
                              <span>Última compra: {cliente.ultima_compra}</span>
                              <span className={`font-medium ${diasSemComprar > 30 ? 'text-red-600' : diasSemComprar > 15 ? 'text-orange-600' : 'text-green-600'}`}>
                                {diasSemComprar} dias atrás
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {formatarMoeda(cliente.val_compras)}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">
                              {cliente.qtde_compras} compras
                            </Badge>
                            <Badge variant="outline">
                              {cliente.itens} itens
                            </Badge>
                            <Badge variant="outline">
                              Ticket: {formatarMoeda(cliente.ticket_medio)}
                            </Badge>
                          </div>
                          <div className="mt-3">
                            {cliente.telefone_cliente && cliente.telefone_cliente !== 'Não encontrado' ? (
                              <Button
                                onClick={() => window.open(gerarLinkWhatsApp(cliente), '_blank')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                size="sm"
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                WhatsApp
                              </Button>
                            ) : (
                              <Button
                                disabled
                                className="bg-gray-400 text-gray-600 cursor-not-allowed"
                                size="sm"
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Sem telefone
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {(() => {
                  const clientesFiltrados = dadosVendedora.clientes.filter(cliente => 
                    cliente.cliente.toLowerCase().includes(termoPesquisa.toLowerCase())
                  )
                  
                  if (clientesVisiveis < clientesFiltrados.length) {
                    return (
                      <div className="flex justify-center mt-6">
                        <Button onClick={carregarMaisClientes} variant="outline" size="lg">
                          Carregar mais clientes ({clientesFiltrados.length - clientesVisiveis} restantes)
                        </Button>
                      </div>
                    )
                  }
                  
                  if (clientesFiltrados.length > 20 && clientesVisiveis >= clientesFiltrados.length) {
                    return (
                      <div className="text-center mt-6 text-gray-600">
                        {termoPesquisa ? 
                          `${clientesFiltrados.length} cliente(s) encontrado(s) para "${termoPesquisa}"` :
                          `Todos os ${clientesFiltrados.length} clientes foram carregados`
                        }
                      </div>
                    )
                  }
                  
                  if (termoPesquisa && clientesFiltrados.length === 0) {
                    return (
                      <div className="text-center mt-6 text-gray-500">
                        Nenhum cliente encontrado para "{termoPesquisa}"
                      </div>
                    )
                  }
                  
                  return null
                })()}
              </CardContent>
            </Card>
          </>
        )}

        {/* Estado inicial */}
        {!vendedoraSelecionada && (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Selecione uma vendedora
              </h3>
              <p className="text-gray-600">
                Escolha uma vendedora no seletor acima para visualizar o ranking de seus clientes
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App
