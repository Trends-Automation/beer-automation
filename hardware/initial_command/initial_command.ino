const int pinRele = 8;

void setup() {
  pinMode(pinRele, OUTPUT);
  digitalWrite(pinRele, HIGH);
  Serial.begin(9600);
}

void loop() {
  if(Serial.available()) {
    String comando = Serial.readStringUntil('\n');
    comando.trim();
    if(comando == "ABRIR") {
      digitalWrite(pinRele, LOW);
      delay(5000);
      digitalWrite(pinRele, HIGH);
      Serial.println("OK");
    } else {
      Serial.println("COMANDO_INVALIDO");
    }
  }
}