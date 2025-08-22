const int pinRele = 8;
const float FLOW_RATE_ML_PER_SEC = 100.0;

void setup() {
  pinMode(pinRele, OUTPUT);
  digitalWrite(pinRele, HIGH);
  Serial.begin(9600);
}

void loop() {
  if(Serial.available()) {
    String comando = Serial.readStringUntil('\n');
    comando.trim();
    if(comando.startsWith("ABRIR")) {
      String volumeStr = comando.substring(6);
      int volumeMl = volumeStr.toInt();
      if(volumeMl > 0 && volumeMl <= 1000) {
        int delayMs = (volumeMl/FLOW_RATE_ML_PER_SEC) * 1000;
        digitalWrite(pinRele, LOW);
        delay(delayMs);
        digitalWrite(pinRele, HIGH);
        Serial.println("OK");
      } else {
        Serial.println("VOLUME_INVALIDO");
      }
    } else {
      Serial.println("COMANDO_INVALIDO");
    }
  }
}