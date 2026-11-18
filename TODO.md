# Controle de Frota — Entregas

- [ ] **Base operacional persistente**
  - Manter cadastros editáveis de placas, tipos, sistemas e oficinas/fornecedores em banco de dados.
  - Carregar inicialmente as 18 placas fornecidas, os tipos Corretiva, Preventiva e Emergencial, e os sistemas Freio, Motor, Suspensão, Thermo King e demais sistemas básicos.

- [ ] **Lançamentos de manutenção**
  - Permitir criar e editar lançamentos com data, placa, KM, tipo, sistema, serviço executado, peça/material, quantidade, valores, oficina/fornecedor, próxima troca/manutenção e observação.
  - Calcular automaticamente o valor total das peças pela quantidade e valor unitário, e o valor total da manutenção pela soma de peças e mão de obra.
  - Validar campos obrigatórios, datas, quilometragem, quantidades e valores não negativos, usando listas de seleção originadas dos cadastros.

- [ ] **Histórico pesquisável**
  - Exibir os lançamentos mais recentes e permitir filtros por placa, tipo, sistema e período.
  - Exibir os detalhes financeiros e operacionais de cada registro.

- [ ] **Dashboard e alertas**
  - Exibir quantidade de manutenções, custo total, custo de peças, custo de mão de obra e serviços próximos nos próximos 30 dias.
  - Mostrar análises por placa, tipo, sistema e mês.
  - Destacar preventivas vencidas e as que vencem em até 30 dias.

- [ ] **Experiência para celular**
  - Criar uma interface em português do Brasil, responsiva para celular, tablet e computador, acessível por link próprio e sem depender do AppSheet.
