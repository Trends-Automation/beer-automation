const int RELAY_PIN = 8;
unsigned long startTime = 0;
int ml = 0;

void setup() {
  Serial.begin(9600);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // relé desligado
}

void loop() {
  if(Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    if(command.startsWith("ABRIR ")) {
      ml = command.substring(6).toInt();
      if(ml > 0) {
        startTime = millis();
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("OK"); 
      } else {
        Serial.println("ERROR");
      }
    }
  }
  if(ml > 0 && (millis() - startTime >= (ml / 100 * 1000))) {
    digitalWrite(RELAY_PIN, HIGH);
    ml = 0;
  }
}