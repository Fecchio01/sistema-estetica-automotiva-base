import test from 'node:test'
import assert from 'node:assert/strict'
import { reportRowsToCsv } from '../src/report-export.js'

test('gera CSV do relatório com cabeçalho e valores escapados', () => {
  const csv = reportRowsToCsv([{ client: 'Ana, Silva', service: 'Polimento', amount: 450, status: 'Em andamento' }])
  assert.equal(csv, 'Cliente;Serviço;Valor;Status\r\n"Ana, Silva";Polimento;450;Em andamento')
})

test('gera CSV vazio mantendo o cabeçalho', () => {
  assert.equal(reportRowsToCsv([]), 'Cliente;Serviço;Valor;Status')
})
