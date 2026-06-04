# Przewodnik egzaminacyjny Java — Część 5: Typy wyliczeniowe Enum
## (pytania 141–160)

---

## 1. Podstawy enum — co kompilator generuje

### Pytanie 141 — czym jest enum i co kompilator tworzy?

`enum` to specjalny typ klasy w Javie. Kompilator generuje dla niego konkretną klasę dziedziczącą po `java.lang.Enum<E>`.

```java
// To co piszesz:
public enum Day {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
}

// Co kompilator FAKTYCZNIE generuje (przybliżony odpowiednik):
public final class Day extends java.lang.Enum<Day> {
    public static final Day MONDAY   = new Day("MONDAY", 0);
    public static final Day TUESDAY  = new Day("TUESDAY", 1);
    public static final Day WEDNESDAY = new Day("WEDNESDAY", 2);
    public static final Day THURSDAY = new Day("THURSDAY", 3);
    public static final Day FRIDAY   = new Day("FRIDAY", 4);
    public static final Day SATURDAY = new Day("SATURDAY", 5);
    public static final Day SUNDAY   = new Day("SUNDAY", 6);

    private static final Day[] VALUES = { MONDAY, TUESDAY, ... };

    private Day(String name, int ordinal) {
        super(name, ordinal); // konstruktor Enum
    }

    public static Day[] values() { return VALUES.clone(); }
    public static Day valueOf(String name) { ... }
    // Dziedziczy z Enum: name(), ordinal(), toString(), equals(), hashCode(), compareTo()
}
```

**KLUCZOWE fakty o enum:**

1. **Niejawnie `final`** — nie można dziedziczyć po enum (ani po nim dziedziczyć).
2. **Dziedziczy po `java.lang.Enum<E>`** — automatycznie.
3. **Konstruktor jest zawsze `private`** (lub package-private) — nie można tworzyć instancji przez `new`.
4. **Stałe są `public static final`** — inicjalizowane przy ładowaniu klasy.
5. **Implementuje `Comparable<E>` i `Serializable`** — przez `java.lang.Enum`.

---

## 2. Konstruktor, pola i metody w enum

### Pytanie 142 — enum z polami i metodami

```java
public enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    VENUS  (4.869e+24, 6.0518e6),
    EARTH  (5.976e+24, 6.37814e6),
    MARS   (6.421e+23, 3.3972e6);

    private final double mass;   // kg
    private final double radius; // metry

    // Konstruktor MUSI być private lub package-private
    // (nigdy public ani protected)
    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
    }

    // Stała grawitacji
    static final double G = 6.67300E-11;

    // Metody instancyjne — każda stała enum może je wywoływać
    double surfaceGravity() {
        return G * mass / (radius * radius);
    }

    double surfaceWeight(double otherMass) {
        return otherMass * surfaceGravity();
    }

    // Gettery:
    public double getMass() { return mass; }
    public double getRadius() { return radius; }
}

// Użycie:
double earthWeight = 75.0;
double mass = earthWeight / Planet.EARTH.surfaceGravity();
for (Planet p : Planet.values()) {
    System.out.printf("Weight on %s is %6.2f%n", p, p.surfaceWeight(mass));
}
```

---

## 3. Metody values(), valueOf(), ordinal(), name()

### Pytanie 143 — wbudowane metody enum

```java
enum Color { RED, GREEN, BLUE }

// values() — zwraca tablicę wszystkich stałych w kolejności deklaracji
Color[] allColors = Color.values();
System.out.println(allColors.length); // 3
for (Color c : Color.values()) {
    System.out.println(c); // RED, GREEN, BLUE
}

// valueOf(String) — pobierz stałą po nazwie (case-sensitive!)
Color green = Color.valueOf("GREEN"); // Color.GREEN
// ❌ Color.valueOf("green") — rzuca IllegalArgumentException (małe litery!)
// ❌ Color.valueOf("PINK") — rzuca IllegalArgumentException (nieistniejąca stała)

// name() — zwraca nazwę stałej jako String (dokładnie jak w kodzie)
System.out.println(Color.RED.name());     // "RED"
System.out.println(Color.GREEN.name());   // "GREEN"

// ordinal() — zwraca pozycję (0-based) w kolejności deklaracji
System.out.println(Color.RED.ordinal());   // 0
System.out.println(Color.GREEN.ordinal()); // 1
System.out.println(Color.BLUE.ordinal());  // 2

// toString() — domyślnie zwraca name(), ale można nadpisać
System.out.println(Color.RED.toString()); // "RED" (domyślnie)

// Nadpisanie toString():
enum Status {
    ACTIVE, INACTIVE, PENDING;

    @Override
    public String toString() {
        return name().charAt(0) + name().substring(1).toLowerCase();
        // ACTIVE → "Active", INACTIVE → "Inactive"
    }
}
System.out.println(Status.ACTIVE); // "Active" — toString() nadpisane

// WAŻNE: ordinal() jest wrażliwe na kolejność deklaracji!
// Nigdy nie używaj ordinal() do logiki biznesowej — może się zmienić przy refaktoryzacji!
// ✅ Zamiast tego używaj własnych pól liczbowych.
```

---

## 4. Implementacja interfejsów przez enum

### Pytanie 144 — enum implements interface

```java
interface Describable {
    String getDescription();
}

interface Togglable {
    boolean isActive();
}

enum Feature implements Describable, Togglable {
    DARK_MODE("Enables dark color scheme", true),
    NOTIFICATIONS("Send push notifications", false),
    AUTO_SAVE("Automatically save changes", true);

    private final String description;
    private boolean active; // NOTE: zwykłe pole (nie final) — można modyfikować

    Feature(String description, boolean active) {
        this.description = description;
        this.active = active;
    }

    @Override
    public String getDescription() { return description; }

    @Override
    public boolean isActive() { return active; }

    // Dodatkowa metoda
    public void toggle() { active = !active; }
}

// Użycie polimorfizmu:
Describable d = Feature.DARK_MODE;
System.out.println(d.getDescription()); // "Enables dark color scheme"

// Iteracja przez interfejs:
for (Feature f : Feature.values()) {
    if (f.isActive()) {
        System.out.println(f.name() + " is active");
    }
}
```

---

## 5. Abstract methods w enum (per-constant class body)

### Pytanie 145 — każda stała z własną implementacją

To jeden z **najważniejszych** i najtrudniejszych tematów egzaminacyjnych o enum:

```java
// Metoda abstrakcyjna w enum — KAŻDA stała musi ją zaimplementować!
enum Operation {
    PLUS("+") {
        @Override
        public double apply(double x, double y) { return x + y; }
    },
    MINUS("-") {
        @Override
        public double apply(double x, double y) { return x - y; }
    },
    TIMES("*") {
        @Override
        public double apply(double x, double y) { return x * y; }
    },
    DIVIDE("/") {
        @Override
        public double apply(double x, double y) {
            if (y == 0) throw new ArithmeticException("Division by zero");
            return x / y;
        }
    };

    private final String symbol;

    Operation(String symbol) { this.symbol = symbol; }

    // Metoda abstrakcyjna — musi być zaimplementowana przez każdą stałą
    public abstract double apply(double x, double y);

    @Override
    public String toString() { return symbol; }
}

// Użycie:
double x = 10, y = 3;
for (Operation op : Operation.values()) {
    System.out.printf("%.0f %s %.0f = %.2f%n", x, op, y, op.apply(x, y));
}
// 10 + 3 = 13.00
// 10 - 3 = 7.00
// 10 * 3 = 30.00
// 10 / 3 = 3.33
```

**WAŻNE:** Gdy stała ma własne ciało (per-constant class body), **tworzona jest anonimowa podklasa** enum. Dlatego:
- Takie stałe **nie są tej samej klasy co enum** — są anonimowymi podklasami.
- `Operation.PLUS.getClass() != Operation.class` — ale `Operation.PLUS.getClass().getSuperclass() == Operation.class`.
- Nadal `Operation.PLUS instanceof Operation` zwraca `true`.

---

## 6. Enum w switch — tradycyjny i switch expression (Java 14+)

### Pytanie 146 — switch z enum

```java
enum Season { SPRING, SUMMER, AUTUMN, WINTER }

// Tradycyjny switch (stary styl):
Season season = Season.SUMMER;
switch (season) {
    case SPRING:
        System.out.println("Warm and rainy");
        break;
    case SUMMER:
        System.out.println("Hot and sunny"); // to się wypisze
        break;
    case AUTUMN:
        System.out.println("Cool and windy");
        break;
    case WINTER:
        System.out.println("Cold and snowy");
        break;
    // WAŻNE: w switch z enum NIE piszemy Season.SUMMER — tylko SUMMER
    // (kompilator już wie, że chodzi o stałe Season)
}

// Switch Expression (Java 14+ stable):
String description = switch (season) {
    case SPRING -> "Warm and rainy";
    case SUMMER -> "Hot and sunny";
    case AUTUMN -> "Cool and windy";
    case WINTER -> "Cold and snowy";
    // Kompilator sprawdza wyczerpanie — jeśli wszystkie przypadki pokryte, nie trzeba default!
};

// Switch Expression z blokiem i yield:
int avgTemp = switch (season) {
    case SPRING -> 15;
    case SUMMER -> 28;
    case AUTUMN -> {
        System.out.println("Computing autumn temperature...");
        yield 10; // yield zwraca wartość z bloku
    }
    case WINTER -> -5;
};

// Pattern matching w switch (Java 21+):
sealed interface Shape permits Circle, Rectangle {}
record Circle(double r) implements Shape {}
record Rectangle(double w, double h) implements Shape {}

double area(Shape s) {
    return switch (s) {
        case Circle c -> Math.PI * c.r() * c.r();
        case Rectangle r -> r.w() * r.h();
    };
}
```

---

## 7. EnumSet

### Pytanie 147 — EnumSet — wydajna kolekcja dla enum

`EnumSet` to wyspecjalizowana implementacja `Set` dla wartości enum. Wewnętrznie używa **bitmapy** (long lub tablica long), co czyni ją ekstremalnie wydajną:

```java
import java.util.EnumSet;

enum Day { MON, TUE, WED, THU, FRI, SAT, SUN }

// Tworzenie EnumSet:
EnumSet<Day> weekdays = EnumSet.of(Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI);
EnumSet<Day> weekend  = EnumSet.of(Day.SAT, Day.SUN);
EnumSet<Day> allDays  = EnumSet.allOf(Day.class);
EnumSet<Day> noDays   = EnumSet.noneOf(Day.class);
EnumSet<Day> monToFri = EnumSet.range(Day.MON, Day.FRI); // zakres

// Kopiowanie:
EnumSet<Day> copy = EnumSet.copyOf(weekdays);

// Komplement:
EnumSet<Day> notWeekdays = EnumSet.complementOf(weekdays); // SAT, SUN

// Operacje:
weekdays.add(Day.SAT);
weekdays.remove(Day.MON);
weekdays.contains(Day.WED); // true

// Iteracja w kolejności deklaracji (nie insertion order jak HashSet):
for (Day d : weekdays) {
    System.out.println(d); // w kolejności: TUE, WED, THU, FRI, SAT
}

// Porównanie wydajności:
// EnumSet: O(1) dla contains/add/remove dzięki bitmapie
// HashSet: O(1) ale z narzutem obliczenia hashCode i porównania
// TreeSet: O(log n) — wolniejszy, ale posortowany
```

**WAŻNE:**
- `EnumSet` jest **niemutowalne** jeśli stworzony przez `EnumSet.of()` w starszych wersjach — ale w nowszych Javach jest mutowalny.
- `EnumSet` **nie może być null** — nie pozwala na `null` jako element.
- Jest implementacją `Set` — nie ma duplikatów.

---

## 8. EnumMap

### Pytanie 148 — EnumMap — wydajna mapa dla kluczy enum

`EnumMap` to wyspecjalizowana implementacja `Map` z kluczami będącymi wartościami enum. Używa tablicy indeksowanej `ordinal()`:

```java
import java.util.EnumMap;

enum Priority { LOW, MEDIUM, HIGH, CRITICAL }

// Tworzenie EnumMap:
EnumMap<Priority, List<String>> tasksByPriority = new EnumMap<>(Priority.class);

// Wstawianie:
tasksByPriority.put(Priority.HIGH, new ArrayList<>(List.of("Fix bug", "Deploy")));
tasksByPriority.put(Priority.LOW, new ArrayList<>(List.of("Write docs")));
tasksByPriority.put(Priority.MEDIUM, new ArrayList<>(List.of("Code review")));
tasksByPriority.put(Priority.CRITICAL, new ArrayList<>(List.of("Server down!")));

// Dostęp:
List<String> criticalTasks = tasksByPriority.get(Priority.CRITICAL);
System.out.println(criticalTasks); // ["Server down!"]

// Iteracja w kolejności deklaracji enum (nie insertion order!):
tasksByPriority.forEach((priority, tasks) -> {
    System.out.println(priority + ": " + tasks);
});
// LOW: [Write docs]
// MEDIUM: [Code review]
// HIGH: [Fix bug, Deploy]
// CRITICAL: [Server down!]

// Porównanie:
// EnumMap: O(1) dostęp, iteracja w kolejności enum, brak null kluczy
// HashMap: O(1) średnio, brak gwarantowanej kolejności, jeden null klucz
// TreeMap: O(log n) dostęp, iteracja posortowana (naturalny porządek enum to kolejność deklaracji)
```

---

## 9. Enum a Singleton pattern

### Pytanie 149 — enum jako najlepsza implementacja Singletona

Joshua Bloch w "Effective Java" rekomenduje `enum` jako **najlepszą implementację Singletona** w Javie:

```java
// ✅ NAJLEPSZA implementacja Singletona — przez enum:
public enum DatabaseConnection {
    INSTANCE;

    private final String url;
    private final int maxConnections;

    DatabaseConnection() {
        // Konstruktor wywołany raz przy inicjalizacji klasy
        this.url = "jdbc:postgresql://localhost:5432/mydb";
        this.maxConnections = 10;
    }

    public String getUrl() { return url; }
    public int getMaxConnections() { return maxConnections; }
    public void executeQuery(String sql) {
        System.out.println("Executing: " + sql);
    }
}

// Użycie:
DatabaseConnection db = DatabaseConnection.INSTANCE;
db.executeQuery("SELECT * FROM users");

// Dlaczego enum Singleton jest lepszy niż klasyczny Singleton?
// 1. Thread-safe — inicjalizacja przez class loader (JVM gwarantuje single-thread)
// 2. Serializacja bezpieczna — JVM gwarantuje jeden egzemplarz nawet po deserializacji
// 3. Ochrona przed reflection — nie można wywołać konstruktora przez refleksję
// 4. Odporny na clone() — enum nie może być klonowany

// PROBLEMY Z KLASYCZNYM SINGLETON:
public class ClassicSingleton {
    private static volatile ClassicSingleton instance;
    private ClassicSingleton() { }

    public static ClassicSingleton getInstance() {
        if (instance == null) {
            synchronized (ClassicSingleton.class) {
                if (instance == null) {
                    instance = new ClassicSingleton();
                }
            }
        }
        return instance;
    }
    // Problemy: serializacja tworzy nowy egzemplarz, refleksja może wywołać konstruktor
}
```

---

## 10. Serializacja enumów

### Pytanie 150 — jak Java serializuje enum?

```java
enum Status { ACTIVE, INACTIVE }

// Podczas serializacji obiektu zawierającego enum:
class User implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private String name;
    private Status status;
    // ...
}

// Java SERIALIZUJE TYLKO NAZWĘ stałej enum (np. "ACTIVE")
// Podczas DESERIALIZACJI Java wywołuje Status.valueOf("ACTIVE")
// Gwarantuje to, że po deserializacji zawsze dostajemy TEN SAM egzemplarz stałej

// ✅ Enum jest BEZPIECZNY dla serializacji — nie tworzy nowych instancji
// (w przeciwieństwie do zwykłych klas Serializable)

// Przykład problemowy (nie dotyczy enum, ale ważny kontekst):
// Zwykły Singleton może dostać zduplikowane instancje przez deserializację
// Enum tego problemu NIE MA

// Zmiana kolejności stałych po serializacji:
// Jeśli mamy: enum Status { ACTIVE, INACTIVE }
// i po serializacji zmieniamy na: enum Status { INACTIVE, ACTIVE }
// Deserializacja NADAL działa poprawnie — szuka po NAZWIE, nie ordinal
// (to przewaga nad zwykłą serializacją przez ordinal())
```

---

## 11. Enum a dziedziczenie — dlaczego niemożliwe?

### Pytanie 151 — dlaczego enum nie może dziedziczyć?

```java
enum Color { RED, GREEN, BLUE }

// ❌ NIEMOŻLIWE — enum nie może dziedziczyć po innym enum:
// enum ExtendedColor extends Color { YELLOW, PURPLE } // BŁĄD KOMPILACJI

// ❌ NIEMOŻLIWE — klasa nie może dziedziczyć po enum:
// class MyColor extends Color { } // BŁĄD KOMPILACJI

// ❌ NIEMOŻLIWE — enum nie może dziedziczyć po zwykłej klasie:
// enum Color extends SomeClass { } // BŁĄD KOMPILACJI

// Powód: Kompilator niejawnie dodaje "extends java.lang.Enum<Color>"
// Java nie pozwala na dziedziczenie po więcej niż jednej klasie

// ✅ MOŻLIWE — enum może IMPLEMENTOWAĆ interfejsy:
interface Colored {
    String getHexCode();
}

enum Color implements Colored {
    RED("#FF0000"),
    GREEN("#00FF00"),
    BLUE("#0000FF");

    private final String hex;
    Color(String hex) { this.hex = hex; }

    @Override
    public String getHexCode() { return hex; }
}

// Alternatywa dla dziedziczenia enum — kompozycja:
enum BasicColor { RED, GREEN, BLUE }
enum ExtendedColor {
    RED(BasicColor.RED), GREEN(BasicColor.GREEN), BLUE(BasicColor.BLUE),
    YELLOW(null), PURPLE(null);

    private final BasicColor basic;
    ExtendedColor(BasicColor basic) { this.basic = basic; }
    public boolean isBasic() { return basic != null; }
}
```

---

## 12. Porównywanie enumów — == vs equals()

### Pytanie 152 — == czy equals() dla enum?

```java
enum Status { ACTIVE, INACTIVE }

Status s1 = Status.ACTIVE;
Status s2 = Status.ACTIVE;

// ✅ == jest BEZPIECZNY i ZALECANY dla enum:
System.out.println(s1 == s2);         // true — to ten sam obiekt!
System.out.println(s1.equals(s2));    // true — equals() enum używa == wewnętrznie

// Dlaczego == jest bezpieczne?
// JVM gwarantuje że każda stała enum ma JEDEN egzemplarz (singleton pattern)
// s1 i s2 wskazują na ten sam obiekt w pamięci

// Porównanie z null:
Status s3 = null;
// ❌ NIEBEZPIECZNE — equals() z null zwraca false, ale:
// s3.equals(Status.ACTIVE) — NullPointerException!
System.out.println(s3 == Status.ACTIVE); // false — bezpieczne
// System.out.println(s3.equals(Status.ACTIVE)); // ❌ NullPointerException!

// Bezpieczne porównanie z null:
System.out.println(Status.ACTIVE.equals(s3)); // false — bezpieczne, bo wywołujemy na non-null

// CompareTo — porównuje według ordinal():
Status.ACTIVE.compareTo(Status.INACTIVE); // ujemne — ACTIVE (0) < INACTIVE (1)
Status.INACTIVE.compareTo(Status.ACTIVE); // dodatnie — INACTIVE (1) > ACTIVE (0)
```

**KLUCZOWE:** Dla enum zawsze używaj `==` zamiast `equals()` — jest bezpieczniejsze (nie rzuca NPE gdy wywołane na zmiennej) i komunikuje intencję (identyczność, nie równość).

---

## 13. Enum — zaawansowane wzorce

### Pytanie 153 — enum z logiką biznesową

```java
// Wzorzec State Machine z enum:
enum TrafficLight {
    RED {
        @Override
        public TrafficLight next() { return GREEN; }
    },
    GREEN {
        @Override
        public TrafficLight next() { return YELLOW; }
    },
    YELLOW {
        @Override
        public TrafficLight next() { return RED; }
    };

    public abstract TrafficLight next();
}

// Użycie:
TrafficLight light = TrafficLight.RED;
light = light.next(); // GREEN
light = light.next(); // YELLOW
light = light.next(); // RED — cykl

// Wzorzec Dispatch Table z enum:
enum MathOp {
    ADD {
        @Override public int apply(int a, int b) { return a + b; }
    },
    SUB {
        @Override public int apply(int a, int b) { return a - b; }
    },
    MUL {
        @Override public int apply(int a, int b) { return a * b; }
    };

    public abstract int apply(int a, int b);
}

// Zamiast if-else lub switch — czyste OOP:
String opName = "ADD";
MathOp op = MathOp.valueOf(opName);
System.out.println(op.apply(5, 3)); // 8
```

---

## 14. Enum — inicjalizacja i ładowanie klas

### Pytanie 154 — kiedy stałe enum są inicjalizowane?

```java
enum Config {
    INSTANCE;

    private final String connectionString;
    private final int timeout;

    Config() {
        System.out.println("Config enum initialized");
        // Inicjalizacja przy pierwszym użyciu klasy enum
        this.connectionString = "jdbc:postgresql://localhost/mydb";
        this.timeout = 30;
    }

    public String getConnectionString() { return connectionString; }
    public int getTimeout() { return timeout; }
}

// Inicjalizacja następuje LENIWIE — przy pierwszym dostępie do klasy enum:
System.out.println("Before access");
Config.INSTANCE.getConnectionString(); // "Config enum initialized" wypisane tu
System.out.println("After access");

// WAŻNE:
// - Inicjalizacja jest THREAD-SAFE — JVM gwarantuje
// - Stałe są inicjalizowane w kolejności deklaracji
// - Konstruktor enum jest zawsze private lub package-private
// - Nie można wywołać konstruktora enum przez refleksję (EnumConstantNotPresentException)
```

---

## 15. Enum a refleksja

### Pytanie 155 — inspekcja enum przez refleksję

```java
enum Planet { MERCURY, VENUS, EARTH, MARS }

Class<Planet> clazz = Planet.class;

// Sprawdzenie czy to enum:
System.out.println(clazz.isEnum()); // true

// Pobranie wszystkich stałych przez refleksję:
Planet[] constants = clazz.getEnumConstants();
for (Planet p : constants) {
    System.out.println(p.name() + " ordinal=" + p.ordinal());
}

// Sprawdzenie czy pole jest stałą enum:
java.lang.reflect.Field[] fields = clazz.getDeclaredFields();
for (java.lang.reflect.Field f : fields) {
    if (f.isEnumConstant()) {
        System.out.println("Enum constant: " + f.getName());
    }
}

// Próba tworzenia enum przez refleksję — NIEMOŻLIWE:
try {
    java.lang.reflect.Constructor<Planet> constructor = 
        clazz.getDeclaredConstructor(String.class, int.class);
    constructor.setAccessible(true);
    // constructor.newInstance("JUPITER", 4); // ❌ IllegalArgumentException
} catch (Exception e) {
    System.out.println("Cannot create enum by reflection: " + e.getMessage());
}
```

---

## 16. EnumSet i EnumMap — szczegółowe operacje

### Pytanie 156 — zaawansowane operacje na EnumSet i EnumMap

```java
enum Permission { READ, WRITE, EXECUTE, DELETE, ADMIN }

// EnumSet — operacje zbiorowe:
EnumSet<Permission> userPerms = EnumSet.of(Permission.READ, Permission.WRITE);
EnumSet<Permission> adminPerms = EnumSet.allOf(Permission.class);

// Sprawdzenie czy userPerms jest podzbiorem adminPerms:
adminPerms.containsAll(userPerms); // true — wszystkie uprawnienia usera są w admin

// Dodanie uprawnień:
userPerms.addAll(EnumSet.of(Permission.EXECUTE));

// Usunięcie uprawnień:
adminPerms.removeAll(EnumSet.of(Permission.DELETE));

// Iteracja — zawsze w kolejności deklaracji, niezależnie od kolejności dodawania:
EnumSet<Permission> mixed = EnumSet.of(Permission.EXECUTE, Permission.READ, Permission.ADMIN);
mixed.forEach(System.out::println); // READ, EXECUTE, ADMIN — w kolejności deklaracji!

// EnumMap — szczegółowe użycie:
EnumMap<Permission, String> permDescriptions = new EnumMap<>(Permission.class);
permDescriptions.put(Permission.READ, "Can read files");
permDescriptions.put(Permission.WRITE, "Can write files");
permDescriptions.put(Permission.EXECUTE, "Can execute programs");

// getOrDefault:
String desc = permDescriptions.getOrDefault(Permission.ADMIN, "No description");
System.out.println(desc); // "No description" — brak ADMIN w mapie

// computeIfAbsent:
permDescriptions.computeIfAbsent(Permission.DELETE, k -> "Can delete files");

// EnumMap vs HashMap dla kluczy enum:
// EnumMap jest szybszy, zajmuje mniej pamięci
// HashMapjest bardziej ogólny, nie wymaga enum
```

---

## 17. Enum a generyki

### Pytanie 157 — enum z parametrami generycznymi

```java
// Enum NIE może mieć parametrów generycznych:
// ❌ enum Pair<T> { FIRST, SECOND } // BŁĄD KOMPILACJI

// Ale interfejs implementowany przez enum MOŻE:
interface TypedEnum<T> {
    T getValue();
}

// Obejście przez interfejs:
enum Configuration implements TypedEnum<String> {
    HOST("localhost"),
    PORT("8080"),
    PATH("/api");

    private final String value;
    Configuration(String value) { this.value = value; }

    @Override
    public String getValue() { return value; }
}

// Metoda generyczna pracująca z enum:
static <E extends Enum<E>> E findByName(Class<E> enumClass, String name) {
    return Arrays.stream(enumClass.getEnumConstants())
                 .filter(e -> e.name().equalsIgnoreCase(name))
                 .findFirst()
                 .orElseThrow(() -> new IllegalArgumentException("No enum: " + name));
}

// Użycie:
Day day = findByName(Day.class, "monday"); // Day.MONDAY (case insensitive)
```

---

## 18. Enum — ordinal() i niebezpieczeństwa

### Pytanie 158 — dlaczego nie używać ordinal() w logice?

```java
// ❌ ZŁE — używanie ordinal() jako indeksu lub wartości biznesowej:
enum Medal { GOLD, SILVER, BRONZE }

// Problem: ordinal zależy od kolejności deklaracji
// Jeśli dodamy PLATINUM przed GOLD:
// PLATINUM.ordinal() = 0, GOLD.ordinal() = 1 — ZMIENIŁO SIĘ!

// ❌ Niebezpieczny kod:
int[] medalPoints = {100, 50, 25};
Medal medal = Medal.GOLD;
int points = medalPoints[medal.ordinal()]; // zależy od kolejności deklaracji!

// ✅ BEZPIECZNE — własne pole z wartością:
enum MedalSafe {
    GOLD(100),
    SILVER(50),
    BRONZE(25),
    PLATINUM(150); // dodanie na końcu lub w środku NIE psuje logiki

    private final int points;
    MedalSafe(int points) { this.points = points; }
    public int getPoints() { return points; }
}

int safePoints = MedalSafe.GOLD.getPoints(); // zawsze 100, niezależnie od kolejności

// Jedyne legalne użycie ordinal() to struktury danych wewnątrz samego JDK
// (np. EnumSet/EnumMap używają ordinal() do indeksowania bitmapy/tablicy)
```

---

## 19. Enum — switch expression i wyczerpanie

### Pytanie 159 — kompilator sprawdza wyczerpanie switch dla enum

```java
enum Coin { PENNY, NICKEL, DIME, QUARTER }

// Switch expression MUSI obsłużyć wszystkie wartości enum:
int value = switch (coin) {
    case PENNY   -> 1;
    case NICKEL  -> 5;
    case DIME    -> 10;
    case QUARTER -> 25;
    // Brak default — OK, bo wszystkie stałe są pokryte
};

// Jeśli brakuje case — BŁĄD KOMPILACJI:
// int bad = switch (coin) {
//     case PENNY -> 1;
//     case NICKEL -> 5;
//     // brak DIME i QUARTER — ❌ błąd
// };

// ✅ Można użyć default jako "catch all":
int withDefault = switch (coin) {
    case PENNY -> 1;
    default -> -1; // dla NICKEL, DIME, QUARTER
};

// Tradycyjny switch — NIE weryfikuje wyczerpania:
switch (coin) {
    case PENNY:
        System.out.println("1 cent");
        break;
    // Brak innych case — kompiluje się, ale niepełne
}
```

---

## 20. Enum — podsumowanie i pułapki egzaminacyjne

### Pytanie 160 — kluczowe fakty i pułapki

```java
// PUŁAPKI egzaminacyjne:

// 1. Konstruktor enum jest niejawnie private — nie możesz pisać public:
enum E {
    A, B;
    // E() { } // ✅ OK — niejawnie private
    // public E() { } // ❌ BŁĄD — modyfikator public niedozwolony
    // protected E() { } // ❌ BŁĄD — modyfikator protected niedozwolony
}

// 2. Enum może mieć abstract methods TYLKO jeśli każda stała je implementuje:
enum WithAbstract {
    X { @Override int val() { return 1; } },
    Y { @Override int val() { return 2; } };
    abstract int val();
}

// 3. Stałe enum są inicjalizowane statycznie — static initializer może nie być potrzebny:
enum Singleton {
    INSTANCE; // konstruktor wywoływany raz
}

// 4. equals() dla enum używa == wewnętrznie — zawsze preferuj ==:
System.out.println(Status.ACTIVE == Status.ACTIVE);       // true
System.out.println(Status.ACTIVE.equals(Status.ACTIVE));  // true (ale używa ==)

// 5. Enum nie może być generic:
// enum Box<T> { ... } // ❌ BŁĄD KOMPILACJI

// 6. Stałe enum NIE mogą być lokalne (wewnątrz metody):
// void method() { enum Local { A, B } } // ❌ BŁĄD przed Java 16
// Od Java 16+ lokalne enum są dozwolone (jak lokalne rekordy)

// 7. Stała enum NIE jest null — jeśli nie znajdziesz stałej valueOf() rzuca wyjątek:
try {
    Day invalid = Day.valueOf("INVALID"); // ❌ IllegalArgumentException
} catch (IllegalArgumentException e) {
    System.out.println("Caught: " + e.getMessage());
}

// 8. Porządek compareTo() = porządek ordinal():
Day.MONDAY.compareTo(Day.FRIDAY); // ujemny (MONDAY=0 < FRIDAY=4)
Day.SUNDAY.compareTo(Day.MONDAY); // dodatni (SUNDAY=6 > MONDAY=0)
```

**Podsumowanie kluczowych zasad:**

| Temat | Zasada |
|---|---|
| Dziedziczenie | Enum niejawnie `extends Enum<E>`, nie może dziedziczyć innych klas |
| Implementacja | Enum MOŻE implementować interfejsy |
| Konstruktor | Zawsze `private` (lub package-private), nigdy `public`/`protected` |
| `ordinal()` | Pozycja 0-based — nie używaj do logiki biznesowej! |
| `name()` vs `toString()` | `name()` zawsze zwraca nazwę stałej, `toString()` można nadpisać |
| `valueOf()` | Case-sensitive, rzuca `IllegalArgumentException` dla nieznanej nazwy |
| `==` | Bezpieczny i zalecany dla porównania enum (singleton pattern) |
| Serializacja | Bezpieczna — JVM serializuje nazwę, nie obiekt |
| `EnumSet`/`EnumMap` | Wydajniejsze od `HashSet`/`HashMap` dla kluczy enum |
| Abstract methods | Każda stała MUSI implementować — tworzy anonimową podklasę |
