package com.beerautomation.backend.model;

public class PagamentoResponse {
    private String id;
    private String mensagem;

    public PagamentoResponse(String id, String mensagem) {
        this.id = id;
        this.mensagem = mensagem;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }
}
