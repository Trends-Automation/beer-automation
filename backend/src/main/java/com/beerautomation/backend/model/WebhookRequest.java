package com.beerautomation.backend.model;

public class WebhookRequest {
    private String type;
    private Data data;

    public static class Data {
        private String id;

        public String getId() {
            return id;
        }
        public void setId(String id) {
            this.id = id;
        }
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Data getData() {
        return data;
    }

    public void setData(Data data) {
        this.data = data;
    }
}
