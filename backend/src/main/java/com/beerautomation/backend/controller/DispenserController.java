package com.beerautomation.backend.controller;

import com.beerautomation.backend.service.ArduinoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dispenser")
public class DispenserController {
    private final ArduinoService arduinoService;

    public DispenserController(ArduinoService arduinoService) {
        this.arduinoService = arduinoService;
    }

    @PostMapping("/liberar")
    public ResponseEntity<?> liberarChopp(@RequestBody DispenserRequest request) {
        try {
            String resultado = arduinoService.liberarChopp(request.getMl());
            return ResponseEntity.ok(resultado);
        } catch(Exception e) {
            return ResponseEntity.status(500).body("Erro ao liberar chopp:" + e.getMessage());
        }
    }

    public static class DispenserRequest {
        private int ml;
        public int getMl() {
            return ml;
        }
        public void setMl(int ml) {
            this.ml = ml;
        }
    }
}
