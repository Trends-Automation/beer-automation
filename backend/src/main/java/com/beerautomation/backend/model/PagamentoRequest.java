package com.beerautomation.backend.model;

public class PagamentoRequest {
    private String valor;
    private String metodo;
    private String[] volumes;

    public String getValor() {
        return valor;
    }

    public void setValor(String valor) {
        this.valor = valor;
    }

    public String getMetodo() {
        return metodo;
    }

    public void setMetodo(String metodo) {
        this.metodo = metodo;
    }

    public String[] getVolumes() {
        return volumes;
    }

    public void setVolumes(String[] volumes) {
        this.volumes = volumes;
    }
}
