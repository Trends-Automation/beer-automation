package com.beerautomation.backend.service;

import com.fazecast.jSerialComm.SerialPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.PrintWriter;
import java.util.Scanner;
import java.util.concurrent.TimeUnit;

@Service
public class ArduinoService {
    @Value("${arduino.port}")
    private String portName;

    @Value("${arduino.baud.rate}")
    private int baudRate;

    private SerialPort serialPort;
    private PrintWriter output;
    private Scanner input;

    @PostConstruct
    public void init() throws Exception {
        serialPort = SerialPort.getCommPort(portName);
        serialPort.setBaudRate(baudRate);
        serialPort.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 1000, 0);
        int retries = 3;
        while(retries > 0) {
            System.out.println("Tentando abrir porta" + portName + " (tentativa " + (4-retries) + "/3");
            if(serialPort.openPort()) {
                System.out.println("Porta serial aberta com sucesso: " + portName);
                output = new PrintWriter(serialPort.getOutputStream(),true);
                input = new Scanner(serialPort.getInputStream());
                return;
            } else {
                System.out.println("Erro ao abrir porta serial: " + serialPort.getSystemPortName());
                retries--;
                if(retries == 0){
                    throw new Exception("Falha ao abrir porta serial após tentativas");
                }
                TimeUnit.SECONDS.sleep(5);
            }
        }
    }

    @PreDestroy
    public void close() {
        if(serialPort != null && serialPort.isOpen()) {
            serialPort.closePort();
            System.out.println("Porta serial fechada");
        }
    }

    public String liberarChopp(int ml) throws Exception {
        if(ml <= 0) {
            throw new Exception("Volume inválido");
        }
        if(!serialPort.isOpen()) {
            throw new Exception("Porta serial não está aberta");
        }

        String comando = "ABRIR " + ml + "\n";
        System.out.println("Comando bruto enviado: " + comando);
        output.println(comando);
        System.out.println("Aguardando resposta do Arduino...");

        long startTime = System.currentTimeMillis();
        while(System.currentTimeMillis() - startTime < 15000) { // Aumentado para 15s
            if(input.hasNextLine()) {
                String resposta = input.nextLine().trim();
                System.out.println("Resposta bruta recebida do Arduino: [" + resposta + "]");
                if ("OK".equals(resposta)) {
                    return "Chopp liberado com sucesso";
                } else {
                    throw new Exception("Resposta inválida do Arduino: [" + resposta + "]");
                }
            }
            Thread.sleep(10); // Pausa para evitar consumo excessivo de CPU
        }
        throw new Exception("Timeout aguardando resposta do Arduino (15s)");
    }
}
