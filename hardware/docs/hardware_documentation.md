# Documentação do Hardware
Este documento visa arquivar as especificações, tipo, e maneira como o hardware está sendo controlado e programado.

<a href="#overview_do_hardware">Overview do projeto</a> | <a href="#montagem_e_conexões">Montagem e conexões</a> | <a href="#objetivo">Objetivo</a>

## Overview do projeto
Este projeto é um sistema automatizado para servir chopp, controlado por um Arduino. Ele integra um módulo de relé para controlar o fluxo de líquido e utiliza pagamentos via PIX para acionar a liberação do chopp.

### Componentes utilizados
A seguir, a lista de todos os componentes de hardware necessários para o projeto:

| **Equipamento** | **Quantidade** |
| --- | --- |
| Arduino Uno | 1x |
| Módulo Relé de 1 Canal | 1x |
| Protoboard | 1x |
| Jumpers | 18x |

## Montagem e conexões
O hardware é montado na protoboard para facilitar as conexões. Siga as instruções abaixo para a correta instalação:

### Arduino e Protoboard
1. Conecte a protoboard ao Arduino utilizando jumpers.
2. Ligue a saída **5V** do Arduino ao barramento de energia positivo (+) da protoboard.
3. Ligue o **GND** do Arduino ao barramento de energia negativo (-) da protoboard.

### Arduino e Módulo Relé
1. Conecte o pino de controle do relé (geralmente rotulado como `IN`) ao pino digital **D2** do Arduino.
2. Ligue o pino de alimentação do relé (`VCC`) ao barramento de energia positivo (+) da protoboard.
3. Ligue o pino de aterramento do relé (`GND`) ao barramento de energia negativo (-) da protoboard.
