# Przewodnik egzaminacyjny Java — Część 3: Interfejsy
## (pytania 61–100)

---

## 1. Podstawowe zasady interfejsów — fundament koncepcji

### Pytanie 61 — czym jest interfejs i co gwarantuje?

Interfejs w Javie to **kontrakt** — deklaracja zestawu metod, które klasa implementująca musi dostarczyć. Interfejs definiuje *co* obiekt potrafi robić, nie *jak* to robi.

**Kluczowe zasady (od Java 8+):**

```java
public interface Drawable {
    // Stała — niejawnie public static final
    int MAX_SIZE = 1000; // kompilator traktuje to jak: public static final int MAX_SIZE = 1000;

    // Metoda abstrakcyjna — niejawnie public abstract
    void draw(); // kompilator traktuje to jak: public abstract void draw();

    // Metoda default (Java 8) — ma implementację
    default void drawWithBorder() {
        System.out.println("Drawing with border...");
        draw(); // wywołuje abstrakcyjną metodę — polimorfizm!
    }

    // Metoda statyczna (Java 8) — należy do interfejsu, nie do implementujących klas
    static Drawable createDefault() {
        return () -> System.out.println("Default drawable");
    }

    // Metoda prywatna (Java 9) — helper dla default i static
    private void logDraw() {
        System.out.println("Logging draw operation");
    }
}
```

**WAŻNE — co kompilator dodaje niejawnie:**

| Deklaracja w interfejsie | Co kompilator widzi |
|---|---|
| `void doSomething()` | `public abstract void doSomething()` |
| `int VALUE = 42` | `public static final int VALUE = 42` |
| `default void method()` | `public default void method()` |
| `static void helper()` | `public static void helper()` |
| `private void priv()` | `private void priv()` (Java 9+, nie jest `abstract`) |

---

## 2. Metody default — Java 8 revolution

### Pytanie 62 — czym są metody default i po co je wprowadzono?

Metody `default` zostały wprowadzone w Java 8 głównie po to, by **ewolucja istniejących interfejsów nie łamała kompatybilności wstecznej**. Przed Java 8, dodanie nowej metody do publicznego interfejsu wymagało aktualizacji wszystkich implementacji.

```java
public interface Collection<E> {
    // Przed Java 8: dodanie tej metody złamałoby MILIONY implementacji
    // Od Java 8: default — istniejące implementacje nie muszą nic zmieniać
    default Stream<E> stream() {
        return StreamSupport.stream(spliterator(), false);
    }

    default void forEach(Consumer<? super E> action) {
        Objects.requireNonNull(action);
        for (E t : this) {
            action.accept(t);
        }
    }
}
```

**Zasady metod default:**

```java
interface Greeter {
    String getName();

    default String greet() {
        return "Hello, " + getName() + "!"; // może wywoływać abstrakcyjne metody
    }

    default String greetFormally() {
        return "Good day, " + getName() + ".";
    }
}

class FormalGreeter implements Greeter {
    private String name;

    FormalGreeter(String name) { this.name = name; }

    @Override
    public String getName() { return name; }

    // greetFormally() jest dziedziczone — możemy nie nadpisywać
    // Ale MOŻEMY nadpisać jeśli chcemy:
    @Override
    public String greetFormally() {
        return "Esteemed " + getName() + ", greetings.";
    }
}
```

**Kiedy nadpisać metodę default?**
1. Gdy domyślna implementacja jest nieoptymalna dla konkretnej klasy.
2. Gdy istnieje konflikt (dwa interfejsy dają tę samą metodę default).
3. Gdy semantycznie klasa powinna zachowywać się inaczej.

---

## 3. Metody statyczne w interfejsach

### Pytanie 63 — metody static w interfejsach — zasady i ograniczenia

**KLUCZOWE:** Metody statyczne w interfejsach **NIE są dziedziczone** przez klasy implementujące ani przez subinterfejsy. Można je wywoływać **tylko przez nazwę interfejsu**.

```java
interface MathOperations {
    static int add(int a, int b) { return a + b; }
    static int multiply(int a, int b) { return a * b; }

    int calculate(int a, int b); // abstrakcyjna
}

class Calculator implements MathOperations {
    @Override
    public int calculate(int a, int b) { return a + b; }

    void example() {
        MathOperations.add(1, 2);     // ✅ OK — przez nazwę interfejsu
        // this.add(1, 2);            // ❌ BŁĄD — metody static interfejsu nie są dziedziczone
        // Calculator.add(1, 2);      // ❌ BŁĄD — nie jest dostępna przez nazwę klasy
    }
}

// Wywołanie:
int result = MathOperations.add(3, 4); // ✅ jedyny poprawny sposób
```

**Porównanie: metoda statyczna interfejsu vs klasy:**

```java
interface I {
    static void staticMethod() { System.out.println("I.staticMethod"); }
}

class C implements I {
    // C.staticMethod() — BŁĄD! Nie ma dostępu do statycznej metody interfejsu przez klasę
}

// Użycie:
I.staticMethod(); // ✅ jedyny sposób
```

---

## 4. Metody prywatne w interfejsach (Java 9)

### Pytanie 64 — metody private w interfejsach — po co?

Metody prywatne (Java 9) rozwiązują problem **duplikacji kodu** między metodami `default`. Przed Java 9 nie było możliwości ekstrakcji wspólnej logiki z kilku metod `default` bez eksponowania tej logiki jako `public`.

```java
interface Logger {
    void log(String message);

    default void logInfo(String msg) {
        log(format("INFO", msg));  // reużywa prywatnej metody
    }

    default void logWarning(String msg) {
        log(format("WARN", msg));  // reużywa prywatnej metody
    }

    default void logError(String msg) {
        log(format("ERROR", msg)); // reużywa prywatnej metody
    }

    // Prywatna metoda helper — dostępna tylko wewnątrz tego interfejsu
    private String format(String level, String msg) {
        return "[" + level + "] " + java.time.LocalTime.now() + " - " + msg;
    }
}
```

**Zasady metod prywatnych:**
- Muszą mieć ciało (implementację).
- Nie mogą być `abstract`.
- Nie są dziedziczone przez klasy implementujące ani subinterfejsy.
- Mogą być wywołane tylko przez metody `default` lub inne `private` metody tego interfejsu.
- Mogą być `private static` — wtedy dostępne tylko z metod `static` interfejsu.

```java
interface Validator {
    boolean validate(String input);

    default boolean validateAndLog(String input) {
        boolean result = validate(input);
        logResult(input, result); // wywołanie prywatnej
        return result;
    }

    private void logResult(String input, boolean result) {
        System.out.println("Validated '" + input + "': " + result);
    }

    // Prywatna STATYCZNA — może być wywołana z metody static
    static Validator nonEmpty() {
        return input -> {
            logStaticHelper("nonEmpty", input); // wywołanie private static
            return input != null && !input.isEmpty();
        };
    }

    private static void logStaticHelper(String type, String input) {
        System.out.println("Creating " + type + " validator for: " + input);
    }
}
```

---

## 5. Interfejs a klasa abstrakcyjna — kiedy co wybrać?

### Pytanie 65 — fundamentalne porównanie

To jedno z **najczęstszych pytań egzaminacyjnych**. Rozumiej różnice głęboko:

| Cecha | Interfejs | Klasa abstrakcyjna |
|---|---|---|
| Pola instancyjne | ❌ Tylko `public static final` | ✅ Dowolne |
| Konstruktory | ❌ Brak | ✅ Tak |
| Wielokrotne dziedziczenie | ✅ Klasa może implementować wiele | ❌ Tylko jedna klasa bazowa |
| Modyfikatory metod | `public` (domyślnie), `private` (Java 9) | Dowolne (`private`, `protected`, `public`) |
| Stan (state) | ❌ Nie przechowuje stanu | ✅ Może mieć stan przez pola |
| Użycie | "potrafi coś" (can-do) | "jest czymś" (is-a) |
| `abstract` słowo kluczowe | Nie potrzebne (niejawne) | Wymagane dla klasy i metod |

```java
// KIEDY interfejs: modelowanie zachowań niezwiązanych hierarchią
interface Flyable {
    void fly();
    default String getStatus() { return "Flying"; }
}

interface Swimmable {
    void swim();
}

// Duck może latać I pływać — wielokrotna implementacja
class Duck implements Flyable, Swimmable {
    @Override public void fly() { System.out.println("Duck flies"); }
    @Override public void swim() { System.out.println("Duck swims"); }
}

// KIEDY klasa abstrakcyjna: wspólny stan, konstruktory, template method
abstract class Vehicle {
    private final String brand; // STAN — tylko klasa abstrakcyjna może to mieć
    private int speed = 0;

    protected Vehicle(String brand) { // konstruktor z parametrem
        this.brand = brand;
    }

    // Template method
    public final void start() {
        performPreStartCheck();
        accelerate();
        System.out.println(brand + " started at " + speed + " km/h");
    }

    protected abstract void performPreStartCheck();
    protected abstract void accelerate();

    public String getBrand() { return brand; }
}
```

**Zasada wyboru:**
- Użyj **interfejsu** gdy definiujesz kontrakt, który mogą spełnić niezwiązane klasy.
- Użyj **klasy abstrakcyjnej** gdy masz stan do współdzielenia, potrzebujesz konstruktorów z parametrami lub chcesz wzorca Template Method z chronionymi krokami.

---

## 6. Wielokrotna implementacja interfejsów

### Pytanie 66 — implementacja wielu interfejsów jednocześnie

```java
interface Printable {
    void print();
}

interface Saveable {
    void save(String path);
}

interface Loadable {
    void load(String path);
}

// Klasa implementuje TRZY interfejsy jednocześnie
class Document implements Printable, Saveable, Loadable {
    private String content;

    Document(String content) { this.content = content; }

    @Override
    public void print() {
        System.out.println("Printing: " + content);
    }

    @Override
    public void save(String path) {
        System.out.println("Saving to: " + path);
    }

    @Override
    public void load(String path) {
        System.out.println("Loading from: " + path);
    }
}

// Polimorfizm — ta sama klasa, różne widoki:
Document doc = new Document("Hello");
Printable p = doc;   // widok jako Printable
Saveable s = doc;    // widok jako Saveable
Loadable l = doc;    // widok jako Loadable

p.print();           // wywołuje Document.print()
```

**WAŻNE:** Klasa może **dziedziczyć po jednej klasie** i jednocześnie **implementować wiele interfejsów**:

```java
abstract class AbstractEditor {
    protected String content = "";
    public abstract void edit();
}

interface Printable { void print(); }
interface Exportable { void export(String format); }

class TextEditor extends AbstractEditor implements Printable, Exportable {
    @Override public void edit() { content = "edited"; }
    @Override public void print() { System.out.println(content); }
    @Override public void export(String format) { System.out.println("Exporting as " + format); }
}
```

---

## 7. Konflikt metod default z dwóch interfejsów

### Pytanie 67 — jak Java rozwiązuje konflikty metod default?

To jeden z **najważniejszych** tematów egzaminacyjnych związanych z interfejsami. Gdy dwa interfejsy dostarczają metodę `default` o tej samej sygnaturze, klasa implementująca **musi** jawnie rozwiązać konflikt.

```java
interface A {
    default String greet() {
        return "Hello from A";
    }
}

interface B {
    default String greet() {
        return "Hello from B";
    }
}

// ❌ BŁĄD KOMPILACJI — klasa C dziedziczy dwie sprzeczne implementacje default
// class C implements A, B { } // błąd!

// ✅ POPRAWNIE — klasa MUSI nadpisać greet() i rozwiązać konflikt
class C implements A, B {
    @Override
    public String greet() {
        // Opcja 1: własna implementacja
        return "Hello from C";
    }
}

class D implements A, B {
    @Override
    public String greet() {
        // Opcja 2: delegacja do konkretnego interfejsu przez InterfaceName.super.method()
        return A.super.greet(); // ✅ wybieramy implementację z A
    }
}

class E implements A, B {
    @Override
    public String greet() {
        // Opcja 3: kombinacja obu
        return A.super.greet() + " and " + B.super.greet();
    }
}
```

**Zasady rozwiązywania konfliktów (priorytet):**

1. **Klasa wygrywa nad interfejsem** — jeśli klasa (lub jej nadklasa) definiuje metodę, ta implementacja wygrywa nad metodami `default` interfejsów.
2. **Bardziej specyficzny interfejs wygrywa** — jeśli interfejs B rozszerza interfejs A i oba mają metodę `default`, wygrywa implementacja z B.
3. **Jawne rozwiązanie wymagane** — gdy żadna z powyższych reguł nie rozstrzyga, klasa musi jawnie nadpisać metodę.

```java
interface Base {
    default String info() { return "Base"; }
}

interface Derived extends Base {
    @Override
    default String info() { return "Derived"; } // bardziej specyficzny — wygrywa
}

class MyClass implements Base, Derived {
    // NIE musi nadpisywać info() — Derived.info() wygrywa (bardziej specyficzne)
    // Wywołanie: new MyClass().info() → "Derived"
}

// Reguła 1: klasa wygrywa nad interfejsem
class ParentClass {
    public String info() { return "ParentClass"; }
}

class ChildClass extends ParentClass implements Base {
    // ParentClass.info() wygrywa nad Base.info() — klasa > interfejs
    // Nie trzeba nadpisywać
}
```

---

## 8. Dziedziczenie interfejsów

### Pytanie 68 — interface extends interface

Interfejs może rozszerzać **jeden lub więcej** innych interfejsów:

```java
interface Animal {
    String getName();
    void makeSound();
}

interface Pet extends Animal {
    String getOwner();

    // Może dodawać nowe metody abstrakcyjne
    default void greetOwner() {
        System.out.println(getName() + " greets " + getOwner()); // reużywa z Animal
    }
}

interface DomesticAnimal extends Animal, Pet {
    // Rozszerza DWIE interfejsy jednocześnie!
    void beVaccinated();
}

// Klasa implementująca DomesticAnimal musi zaimplementować:
// - getName() i makeSound() z Animal
// - getOwner() z Pet
// - beVaccinated() z DomesticAnimal
class Dog implements DomesticAnimal {
    private String name, owner;

    Dog(String name, String owner) {
        this.name = name;
        this.owner = owner;
    }

    @Override public String getName() { return name; }
    @Override public void makeSound() { System.out.println("Woof!"); }
    @Override public String getOwner() { return owner; }
    @Override public void beVaccinated() { System.out.println("Vaccinated!"); }
    // greetOwner() jest dziedziczone z Pet
}
```

**WAŻNE:** Gdy interfejs dziedziczy po innym interfejsie i oba mają metodę `default` o tej samej sygnaturze, implementacja z bardziej specyficznego (dziedziczącego) interfejsu wygrywa.

---

## 9. Interfejsy funkcyjne (@FunctionalInterface)

### Pytanie 69 — co to jest interfejs funkcyjny?

**Interfejs funkcyjny** to interfejs posiadający **dokładnie jedną metodę abstrakcyjną** (SAM — Single Abstract Method). Mogą mieć dowolną liczbę metod `default` i `static`.

```java
@FunctionalInterface
interface Calculator {
    int calculate(int a, int b); // jedyna metoda abstrakcyjna

    // Metody default są OK — nie naruszają @FunctionalInterface
    default Calculator andThen(Calculator after) {
        return (a, b) -> after.calculate(this.calculate(a, b), 0);
    }

    // Metody statyczne też są OK
    static Calculator add() { return (a, b) -> a + b; }
}

// Użycie z lambdą — bo to interfejs funkcyjny:
Calculator add = (a, b) -> a + b;
Calculator multiply = (a, b) -> a * b;

System.out.println(add.calculate(3, 4));      // 7
System.out.println(multiply.calculate(3, 4)); // 12
```

**Adnotacja `@FunctionalInterface`:**
- Jest **opcjonalna** — kompilator sam wykryje interfejs funkcyjny.
- Gdy ją dodasz, kompilator **weryfikuje** że interfejs ma dokładnie jedną metodę abstrakcyjną.
- Jeśli interfejs dziedziczy metodę `Object` (np. `equals`, `hashCode`) — to **nie liczy się** jako metoda abstrakcyjna.

```java
@FunctionalInterface
interface Transformer<T> {
    T transform(T input); // jedyna metoda abstrakcyjna

    // equals pochodzi z Object — nie narusza @FunctionalInterface
    @Override
    boolean equals(Object obj);

    // BŁĄD — dodanie drugiej abstrakcyjnej łamie @FunctionalInterface:
    // void doSomethingElse(); // ❌ błąd kompilacji z @FunctionalInterface
}
```

---

## 10. Marker Interfaces

### Pytanie 70 — interfejsy znacznikowe (marker interfaces)

Marker interface to interfejs **bez żadnych metod** — służy tylko jako "etykieta" informująca JVM lub frameworki o specjalnych właściwościach klasy.

```java
// java.io.Serializable — klasyczny marker interface
public interface Serializable {
    // BRAK METOD — to jest właśnie marker interface
}

// java.lang.Cloneable — marker interface
public interface Cloneable {
    // BRAK METOD
}

// Użycie:
class Employee implements java.io.Serializable {
    private String name;
    private int id;
    // JVM wie, że Employee można serializować dzięki Serializable
}

// Sprawdzanie przez instanceof:
Employee emp = new Employee();
if (emp instanceof Serializable) {
    // można serializować
    ObjectOutputStream oos = new ObjectOutputStream(...);
    oos.writeObject(emp);
}
```

**Marker interface vs adnotacja:**

| Aspekt | Marker Interface | Adnotacja |
|---|---|---|
| Sprawdzanie w runtime | `instanceof` | Refleksja |
| Dziedziczenie | ✅ Automatyczne (podklasy też "mają" marker) | ❌ Nie jest dziedziczona (chyba że `@Inherited`) |
| Typowanie | ✅ Można używać jako typ | ❌ Nie jest typem |
| Czytelność | Powiązane z typem klasy | Metadane separowane od kodu |

---

## 11. Comparable vs Comparator

### Pytanie 71 — Comparable i Comparator — kiedy co?

**`Comparable<T>`** — naturalne porządkowanie, implementowane **wewnątrz** klasy:

```java
public interface Comparable<T> {
    int compareTo(T other);
    // Kontrakt: ujemny gdy this < other, 0 gdy equal, dodatni gdy this > other
}

class Student implements Comparable<Student> {
    private String name;
    private double gpa;

    Student(String name, double gpa) {
        this.name = name;
        this.gpa = gpa;
    }

    @Override
    public int compareTo(Student other) {
        // Sortuj po GPA malejąco
        return Double.compare(other.gpa, this.gpa);
    }
}

List<Student> students = new ArrayList<>();
students.add(new Student("Alice", 3.8));
students.add(new Student("Bob", 3.5));
Collections.sort(students); // używa compareTo() — natural ordering
```

**`Comparator<T>`** — zewnętrzne, niestandardowe porządkowanie:

```java
public interface Comparator<T> {
    int compare(T o1, T o2);
    // Wiele metod default: reversed(), thenComparing(), etc.
}

class Student {
    String name;
    double gpa;
    int age;
    // ...
}

// Różne sposoby sortowania bez modyfikowania Student:
Comparator<Student> byName = Comparator.comparing(s -> s.name);
Comparator<Student> byGpaDesc = Comparator.comparingDouble((Student s) -> s.gpa).reversed();
Comparator<Student> byNameThenGpa = Comparator.comparing((Student s) -> s.name)
                                               .thenComparingDouble(s -> s.gpa);

List<Student> students = new ArrayList<>();
students.sort(byName);           // sortuj po imieniu
students.sort(byGpaDesc);        // sortuj po GPA malejąco
students.sort(byNameThenGpa);    // sortuj po imieniu, a potem po GPA
```

**KLUCZOWA różnica:**

| Aspekt | Comparable | Comparator |
|---|---|---|
| Lokalizacja | Wewnątrz klasy (`implements Comparable`) | Zewnętrzna klasa/lambda |
| Ilość porządkowań | Jedno (naturalne) | Nieograniczona |
| Modyfikacja klasy | ✅ Wymagana | ❌ Nie potrzeba |
| Zastosowanie | Naturalne sortowanie (Integer, String) | Elastyczne, niestandardowe sortowanie |

---

## 12. Stałe w interfejsach

### Pytanie 72 — stałe (public static final) w interfejsach

Każde pole zadeklarowane w interfejsie jest **niejawnie** `public static final`:

```java
interface NetworkConstants {
    int PORT = 8080;               // kompilator: public static final int PORT = 8080
    String HOST = "localhost";     // kompilator: public static final String HOST = ...
    int TIMEOUT_MS = 5000;         // kompilator: public static final int TIMEOUT_MS = ...
}

class NetworkClient implements NetworkConstants {
    void connect() {
        // Dostęp do stałych z interfejsu — przez implement:
        System.out.println("Connecting to " + HOST + ":" + PORT);
        // Lub przez nazwę interfejsu:
        System.out.println(NetworkConstants.PORT);
    }
}
```

**UWAGA — antywzorzec "Constant Interface":**

Implementowanie interfejsu TYLKO po to, by mieć dostęp do stałych bez kwalifikatora — to **antywzorzec**. Lepszym rozwiązaniem jest klasa `final` z prywatnym konstruktorem lub `enum`:

```java
// ❌ ANTYWZORZEC — klasa implementuje interfejs tylko dla stałych
class BadClient implements NetworkConstants {
    void doSomething() {
        System.out.println(PORT); // zaśmiecanie przestrzeni nazw klasy
    }
}

// ✅ LEPIEJ — statyczny import
import static com.example.NetworkConstants.*;
class GoodClient {
    void doSomething() {
        System.out.println(PORT); // jasne skąd pochodzi
    }
}
```

---

## 13. Sealed Interfaces (Java 17)

### Pytanie 73 — zapieczętowane interfejsy

`sealed` interfejsy (stabilna funkcja w Java 17) ograniczają które klasy/interfejsy mogą je implementować lub rozszerzać:

```java
// Definicja sealed interface — tylko wymienione typy mogą go implementować
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
    double perimeter();
}

// Każdy dozwolony implementator musi być jednym z trzech:
// - final (nie można po nim dziedziczyć)
// - sealed (dalsze ograniczenie hierarchii)
// - non-sealed (otwarte na dowolne rozszerzenie)

public final class Circle implements Shape {
    private final double radius;

    Circle(double radius) { this.radius = radius; }

    @Override
    public double area() { return Math.PI * radius * radius; }

    @Override
    public double perimeter() { return 2 * Math.PI * radius; }
}

public non-sealed class Rectangle implements Shape {
    // non-sealed — każdy może teraz dziedziczyć po Rectangle
    private final double width, height;

    Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public double area() { return width * height; }

    @Override
    public double perimeter() { return 2 * (width + height); }
}

// Dzięki sealed — wyczerpujące pattern matching (Java 21):
double describe(Shape s) {
    return switch (s) {
        case Circle c -> c.area();
        case Rectangle r -> r.area();
        case Triangle t -> t.area();
        // Kompilator wie, że to wszystkie możliwe typy — brak default potrzebny
    };
}
```

**Korzyści `sealed`:**
- Kompilator zna wszystkie możliwe implementacje.
- Umożliwia **wyczerpujące** wyrażenia `switch` (pattern matching) bez `default`.
- Hierarchia jest **zamknięta** — biblioteka ma pełną kontrolę.
- Łączy zalety `enum` (zamknięty zbiór) z elastycznością klas.

---

## 14. Interfejs a polimorfizm

### Pytanie 74 — polimorfizm przez interfejsy

```java
interface Animal {
    String makeSound();
    default String describe() {
        return "I am an animal that says: " + makeSound();
    }
}

class Dog implements Animal {
    @Override
    public String makeSound() { return "Woof"; }
}

class Cat implements Animal {
    @Override
    public String makeSound() { return "Meow"; }
}

class Duck implements Animal {
    @Override
    public String makeSound() { return "Quack"; }
    
    @Override
    public String describe() {
        return "I am a duck: " + makeSound(); // nadpisuje default
    }
}

// Polimorfizm przez interfejs:
List<Animal> animals = List.of(new Dog(), new Cat(), new Duck());
animals.forEach(a -> System.out.println(a.describe()));
// Dog → "I am an animal that says: Woof" (default z interfejsu)
// Cat → "I am an animal that says: Meow" (default z interfejsu)
// Duck → "I am a duck: Quack" (nadpisane)
```

**Late binding działa tak samo przez interfejsy jak przez klasy:**

```java
Animal a = new Dog(); // referencja typu interfejsu, obiekt konkretny
a.makeSound(); // wywołuje Dog.makeSound() — dynamiczne wiązanie
```

---

## 15. instanceof i sprawdzanie typów

### Pytanie 75 — instanceof z interfejsami

```java
interface Flyable { void fly(); }
interface Swimmable { void swim(); }

class Duck implements Flyable, Swimmable {
    @Override public void fly() { System.out.println("Duck flies"); }
    @Override public void swim() { System.out.println("Duck swims"); }
}

class Eagle implements Flyable {
    @Override public void fly() { System.out.println("Eagle flies"); }
}

Object obj = new Duck();

System.out.println(obj instanceof Flyable);   // true — Duck implementuje Flyable
System.out.println(obj instanceof Swimmable); // true — Duck implementuje Swimmable
System.out.println(obj instanceof Duck);      // true — to jest Duck
System.out.println(obj instanceof Eagle);     // false — Duck nie jest Eagle
```

**Pattern matching z instanceof (Java 16+):**

```java
void processAnimal(Object obj) {
    if (obj instanceof Flyable f) {
        // f jest już rzutowane i dostępne jako Flyable
        f.fly();
    }
    if (obj instanceof Duck duck) {
        duck.fly();
        duck.swim();
    }
}
```

**WAŻNE:** `instanceof` zwraca `true` dla wszystkich interfejsów które klasa implementuje, włącznie z interfejsami które implementuje przez dziedziczenie:

```java
interface Base { }
interface Extended extends Base { }

class MyClass implements Extended { }

MyClass obj = new MyClass();
System.out.println(obj instanceof Extended); // true — bezpośrednia implementacja
System.out.println(obj instanceof Base);     // true — przez Extended (pośrednia)
```

---

## 16. Interfejsy a dziedziczenie po Object

### Pytanie 76 — metody Object a interfejsy

Każda klasa w Javie dziedziczy po `Object`. Interfejs **nie** dziedziczy po `Object`, ale może deklarować metody które są w `Object`:

```java
interface Displayable {
    // Można deklarować metody Object — ale to nie czyni ich "abstrakcyjnymi"
    // w sensie wymogu implementacji (każdy obiekt ma je z Object)
    @Override
    String toString(); // deklaracja — ale implementacja pochodzi z Object

    @Override
    boolean equals(Object obj); // j.w.

    void display(); // to jest jedyna prawdziwa metoda abstrakcyjna
}

// Klasa implementuje Displayable — musi tylko zaimplementować display()
// toString() i equals() są już w Object, więc nie trzeba ich implementować
class Box implements Displayable {
    private int value;
    Box(int value) { this.value = value; }

    @Override
    public void display() { System.out.println("Box(" + value + ")"); }
    // toString() dziedziczone z Object — spełnia kontrakt Displayable
}
```

**Konsekwencja dla @FunctionalInterface:**

Metody odziedziczone z `Object` (`toString`, `equals`, `hashCode`, itp.) **nie liczą się** jako metody abstrakcyjne przy weryfikacji `@FunctionalInterface`.

---

## 17. Rozszerzanie interfejsu przez inny interfejs z metodami default

### Pytanie 77 — dziedziczenie i override metod default

```java
interface Vehicle {
    String getType();

    default String describe() {
        return "Vehicle of type: " + getType();
    }
}

interface ElectricVehicle extends Vehicle {
    int getBatteryLevel();

    // Nadpisanie metody default z nadinterfejsu
    @Override
    default String describe() {
        return "Electric vehicle: " + getType() + ", battery: " + getBatteryLevel() + "%";
    }

    default void charge() {
        System.out.println("Charging...");
    }
}

class Tesla implements ElectricVehicle {
    @Override
    public String getType() { return "Sedan"; }

    @Override
    public int getBatteryLevel() { return 85; }
    // describe() dziedziczone z ElectricVehicle (bardziej specyficzne)
    // charge() dziedziczone z ElectricVehicle
}

Tesla t = new Tesla();
t.describe(); // "Electric vehicle: Sedan, battery: 85%"
```

---

## 18. Interfejs a anonimowe implementacje

### Pytanie 78 — klasy anonimowe implementujące interfejsy

Przed Javą 8 (lambdami), interfejsy funkcyjne były implementowane przez **klasy anonimowe**:

```java
interface Sorter {
    int compare(int a, int b);
}

// Stary styl — klasa anonimowa
Sorter ascending = new Sorter() {
    @Override
    public int compare(int a, int b) {
        return Integer.compare(a, b);
    }
};

// Nowy styl Java 8 — lambda (krótszy zapis)
Sorter ascendingLambda = (a, b) -> Integer.compare(a, b);
// Jeszcze krócej — method reference:
Sorter ascendingRef = Integer::compare;

// Klasa anonimowa może mieć stan (lambda nie może):
int threshold = 5;
Sorter complexSorter = new Sorter() {
    private int callCount = 0; // stan w klasie anonimowej ✅

    @Override
    public int compare(int a, int b) {
        callCount++;
        if (Math.abs(a - b) < threshold) return 0; // captured effectively final
        return Integer.compare(a, b);
    }
};
```

---

## 19. Interfejsy jako typy parametrów i zwracane typy

### Pytanie 79 — interfejsy w sygnaturach metod

Używanie interfejsów jako typów (zamiast konkretnych klas) to **programowanie do interfejsu** — kluczowa zasada OOP:

```java
interface DataStore {
    void save(String key, String value);
    String get(String key);
}

class InMemoryStore implements DataStore {
    private Map<String, String> store = new HashMap<>();
    @Override public void save(String k, String v) { store.put(k, v); }
    @Override public String get(String k) { return store.get(k); }
}

class DatabaseStore implements DataStore {
    @Override public void save(String k, String v) { /* baza danych */ }
    @Override public String get(String k) { return /* baza danych */ null; }
}

// ✅ DOBRA PRAKTYKA — parametr jako interfejs
class UserService {
    private final DataStore store; // typ interfejsu, nie konkretnej implementacji

    UserService(DataStore store) { // wstrzykiwanie zależności
        this.store = store;
    }

    public void saveUser(String id, String name) {
        store.save(id, name);
    }
}

// Można podmienić implementację bez zmiany UserService:
UserService service1 = new UserService(new InMemoryStore());
UserService service2 = new UserService(new DatabaseStore());
```

---

## 20. Interfejsy a typy generyczne

### Pytanie 80 — interfejsy z parametrami typów

```java
interface Repository<T, ID> {
    T findById(ID id);
    List<T> findAll();
    void save(T entity);
    void deleteById(ID id);
}

class User {
    int id;
    String name;
    User(int id, String name) { this.id = id; this.name = name; }
}

// Implementacja z konkretnymi typami:
class UserRepository implements Repository<User, Integer> {
    private Map<Integer, User> storage = new HashMap<>();

    @Override
    public User findById(Integer id) { return storage.get(id); }

    @Override
    public List<User> findAll() { return new ArrayList<>(storage.values()); }

    @Override
    public void save(User user) { storage.put(user.id, user); }

    @Override
    public void deleteById(Integer id) { storage.remove(id); }
}
```

---

## 21. Interfejs z wieloma metodami default — diamond problem w interfejsach

### Pytanie 81 — zaawansowany diamond problem

```java
interface A {
    default String name() { return "A"; }
}

interface B extends A {
    @Override
    default String name() { return "B"; }
}

interface C extends A {
    @Override
    default String name() { return "C"; }
}

// Implementując B i C — Java nie wie które name() wybrać!
// B.name() czy C.name()? Obie nadpisują A.name()
// ❌ BŁĄD KOMPILACJI bez jawnego nadpisania:
class D implements B, C {
    @Override
    public String name() {
        // Musimy jawnie wybrać lub dostarczyć własną implementację
        return B.super.name(); // lub C.super.name() lub własna implementacja
    }
}

// Test:
D d = new D();
d.name(); // "B" — bo wybraliśmy B.super.name()
```

---

## 22. Interfejsy wewnętrzne (nested interfaces)

### Pytanie 82 — interfejs zagnieżdżony w klasie lub interfejsie

```java
class LinkedList<E> {
    // Interfejs zagnieżdżony wewnątrz klasy — niejawnie public static
    public interface Node<T> {
        T getValue();
        Node<T> getNext();
    }

    // Prywatna implementacja wewnętrzna
    private static class NodeImpl<T> implements Node<T> {
        T value;
        Node<T> next;

        NodeImpl(T value) { this.value = value; }

        @Override public T getValue() { return value; }
        @Override public Node<T> getNext() { return next; }
    }
}

// Interfejsy mogą zawierać inne interfejsy:
interface OuterInterface {
    interface InnerInterface {
        void doSomething();
        // Niejawnie: public static — można używać bez instancji OuterInterface
    }

    void outerMethod();
}

// Implementacja:
class MyClass implements OuterInterface, OuterInterface.InnerInterface {
    @Override public void outerMethod() { }
    @Override public void doSomething() { }
}
```

---

## 23. Interfejsy a refleksja

### Pytanie 83 — sprawdzanie interfejsów przez refleksję

```java
interface Printable { void print(); }
interface Saveable { void save(); }

class Document implements Printable, Saveable {
    @Override public void print() { }
    @Override public void save() { }
}

// Refleksja:
Class<?> clazz = Document.class;

// Pobierz wszystkie interfejsy implementowane bezpośrednio:
Class<?>[] interfaces = clazz.getInterfaces();
for (Class<?> iface : interfaces) {
    System.out.println(iface.getName()); // Printable, Saveable
}

// Sprawdź czy klasa implementuje interfejs:
System.out.println(Printable.class.isAssignableFrom(Document.class)); // true

// Sprawdź czy typ jest interfejsem:
System.out.println(Printable.class.isInterface()); // true
System.out.println(Document.class.isInterface());  // false
```

---

## 24. Interfejsy a serializacja

### Pytanie 84 — Serializable jako marker interface w praktyce

```java
import java.io.*;

// Serializable jest marker interface — brak metod
class Config implements Serializable {
    private static final long serialVersionUID = 1L; // zalecane dla stabilności
    
    private String host;
    private int port;
    private transient String password; // transient — nie będzie serializowane

    Config(String host, int port, String password) {
        this.host = host;
        this.port = port;
        this.password = password;
    }
}

// Serializacja i deserializacja:
Config config = new Config("localhost", 8080, "secret123");

// Zapis do pliku:
try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("config.ser"))) {
    oos.writeObject(config);
}

// Odczyt z pliku:
try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream("config.ser"))) {
    Config loaded = (Config) ois.readObject();
    // loaded.password będzie null — pole transient
}
```

---

## 25. Interfejsy funkcyjne z wyjątkami

### Pytanie 85 — obsługa wyjątków sprawdzanych (checked) w interfejsach funkcyjnych

Standardowe interfejsy funkcyjne (np. `Runnable`, `Consumer`) **nie deklarują** wyjątków sprawdzanych. To problem gdy chcemy używać metod rzucających `IOException` itp.:

```java
@FunctionalInterface
interface ThrowingConsumer<T> {
    void accept(T t) throws Exception; // deklaracja checked exception
}

// Własny interfejs funkcyjny z checked exception:
@FunctionalInterface
interface IOAction<T> {
    void execute(T input) throws IOException;
}

// Użycie:
IOAction<String> fileWriter = filename -> {
    Files.writeString(Path.of(filename), "content"); // może rzucić IOException
};

// Wrapper — opakowuje ThrowingConsumer w Consumer<T>:
static <T> Consumer<T> wrap(ThrowingConsumer<T> throwing) {
    return t -> {
        try {
            throwing.accept(t);
        } catch (Exception e) {
            throw new RuntimeException(e); // checked → unchecked
        }
    };
}

// Użycie wrappera:
List<String> files = List.of("a.txt", "b.txt");
files.forEach(wrap(file -> Files.delete(Path.of(file))));
```

---

## 26. Interfejsy a dziedziczenie — rozszerzenie hierarchii

### Pytanie 86 — interfejs rozszerza interfejs, dodaje metody

```java
interface Readable {
    String read();
}

interface Writable {
    void write(String data);
}

// ReadWritable rozszerza DWIE interfejsy — interfejs może
interface ReadWritable extends Readable, Writable {
    // Dziedziczy read() i write(data)
    default void copyTo(Writable destination) {
        destination.write(this.read()); // reużywa obu metod
    }
}

class FileStream implements ReadWritable {
    private String content = "";

    @Override public String read() { return content; }
    @Override public void write(String data) { content += data; }
}

FileStream source = new FileStream();
FileStream dest = new FileStream();
source.write("Hello");
source.copyTo(dest); // "Hello" skopiowane do dest
```

---

## 27. Interfejsy a typy wyliczeniowe (enum implements interface)

### Pytanie 87 — enum implementujący interfejs

```java
interface Describable {
    String getDescription();
}

enum Planet implements Describable {
    MERCURY(3.303e+23, 2.4397e6),
    VENUS(4.869e+24, 6.0518e6),
    EARTH(5.976e+24, 6.37814e6);

    private final double mass;   // w kilogramach
    private final double radius; // w metrach

    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
    }

    @Override
    public String getDescription() {
        return name() + ": mass=" + mass + ", radius=" + radius;
    }

    // Polimorfizm przez interfejs:
    static double totalMass(Describable[] planets) {
        // pobiea opis każdej planety
        return Arrays.stream(Planet.values()).mapToDouble(p -> p.mass).sum();
    }
}

// Polimorfizm:
Describable d = Planet.EARTH;
System.out.println(d.getDescription()); // wywołuje Planet.EARTH.getDescription()
```

---

## 28. Interfejsy a Java Memory Model

### Pytanie 88 — interfejsy a widoczność wątków

Stałe interfejsu (`public static final`) są **stałymi czasu kompilacji** — ich wartości są wbudowywane bezpośrednio w bytecode, co eliminuje problemy z widocznością między wątkami:

```java
interface Constants {
    int TIMEOUT = 1000; // wbudowane w bytecode (compile-time constant)
    // Każdy wątek widzi TIMEOUT = 1000 — brak problemu widoczności
}

// Porównaj z polem statycznym klasy (nie compile-time constant):
class Config {
    public static volatile int timeout = 1000; // wymaga volatile dla widoczności między wątkami
}
```

---

## 29. Hierarchia interfejsów w Java Collections Framework

### Pytanie 89 — interfejsy w kolekcjach

```
Iterable<E>
└── Collection<E>
    ├── List<E>
    │   ├── ArrayList (klasa)
    │   └── LinkedList (klasa)
    ├── Set<E>
    │   ├── HashSet (klasa)
    │   ├── SortedSet<E>
    │   │   └── NavigableSet<E>
    │   │       └── TreeSet (klasa)
    │   └── LinkedHashSet (klasa)
    └── Queue<E>
        ├── Deque<E>
        │   ├── ArrayDeque (klasa)
        │   └── LinkedList (klasa)
        └── PriorityQueue (klasa)

Map<K,V>
├── SortedMap<K,V>
│   └── NavigableMap<K,V>
│       └── TreeMap (klasa)
├── HashMap (klasa)
└── LinkedHashMap (klasa)
```

---

## 30. Kontrakt equals() i hashCode() — interfejs Comparable i kontrakt spójności

### Pytanie 90 — kontrakt compareTo() a equals()

Silna rekomendacja (choć nie wymagana przez kompilator):
`(x.compareTo(y) == 0)` powinno być równoznaczne z `x.equals(y)`

```java
class Temperature implements Comparable<Temperature> {
    private final double celsius;

    Temperature(double celsius) { this.celsius = celsius; }

    @Override
    public int compareTo(Temperature other) {
        return Double.compare(this.celsius, other.celsius);
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof Temperature)) return false;
        Temperature other = (Temperature) obj;
        return Double.compare(this.celsius, other.celsius) == 0;
    }

    @Override
    public int hashCode() {
        return Double.hashCode(celsius);
    }
}

// Spójność:
Temperature t1 = new Temperature(100.0);
Temperature t2 = new Temperature(100.0);
System.out.println(t1.compareTo(t2) == 0); // true
System.out.println(t1.equals(t2));          // true ✅ spójność zachowana
```

---

## 31. Interfejsy a inicjalizacja stałych

### Pytanie 91 — inicjalizacja stałych w interfejsach

Stałe w interfejsach muszą być zainicjalizowane w miejscu deklaracji (nie ma konstruktora!):

```java
interface Config {
    // ✅ OK — inicjalizacja w miejscu deklaracji
    int TIMEOUT = 30_000;

    // ✅ OK — wyrażenie obliczeniowe
    long MAX_SIZE = 1024L * 1024L * 100L; // 100 MB

    // ✅ OK — wywołanie metody statycznej
    String VERSION = System.getProperty("app.version", "1.0.0");

    // ❌ BŁĄD — brak inicjalizacji (nie ma konstruktora gdzie to ustawić)
    // int UNINITIALIZED; // błąd kompilacji
}
```

---

## 32. Interfejsy a typy prymitywne

### Pytanie 92 — interfejsy nie mogą mieć pól instancyjnych prymitywnych

```java
interface Wrong {
    // ❌ Wszystkie pola są public static final — nie możesz mieć "stanu"
    int x = 0; // to jest STAŁA, nie pole instancyjne
}

// Jeśli chcesz interfejsu z getterem/setterem dla wartości:
interface HasPosition {
    int getX();
    int getY();
    void setX(int x); // implementacja może trzymać stan
    void setY(int y);
}

class Point implements HasPosition {
    private int x, y; // stan jest w KLASIE, nie w interfejsie

    @Override public int getX() { return x; }
    @Override public int getY() { return y; }
    @Override public void setX(int x) { this.x = x; }
    @Override public void setY(int y) { this.y = y; }
}
```

---

## 33. Interfejsy a lambda — konwersja

### Pytanie 93 — automatyczna konwersja lambda do interfejsu funkcyjnego

Lambda może być przypisana do **dowolnego interfejsu funkcyjnego** o zgodnej sygnaturze:

```java
// Różne interfejsy funkcyjne o tej samej sygnaturze (String) -> void:
interface Printer { void print(String s); }
interface Displayer { void display(String s); }
interface Shower { void show(String s); }

// Ta sama lambda pasuje do wszystkich:
Printer p = s -> System.out.println(s);
Displayer d = s -> System.out.println(s);
Shower sh = s -> System.out.println(s);

// Kontekst determinuje typ:
void process(Printer printer) { printer.print("Hello"); }
process(s -> System.out.println(s)); // lambda staje się Printer

// Rzutowanie explicite gdy kontekst niejednoznaczny:
process((Printer) s -> System.out.println(s)); // jawne wskazanie interfejsu
```

---

## 34. Implementacja interfejsu przez klasę abstrakcyjną — częściowa implementacja

### Pytanie 94 — klasa abstrakcyjna i częściowa implementacja interfejsu

```java
interface FullService {
    void methodA();
    void methodB();
    void methodC();
    void methodD();
}

// Klasa abstrakcyjna implementuje TYLKO część — resztę pozostawia podklasom:
abstract class PartialService implements FullService {
    @Override
    public void methodA() {
        System.out.println("Default A implementation");
    }

    @Override
    public void methodB() {
        System.out.println("Default B implementation");
    }

    // methodC() i methodD() NIE są zaimplementowane — podklasy muszą je dostarczyć
    // Nie trzeba ich nawet deklarować jako abstract — są dziedziczone z interfejsu
}

class ConcreteService extends PartialService {
    @Override
    public void methodC() { System.out.println("C"); }

    @Override
    public void methodD() { System.out.println("D"); }
    // methodA() i methodB() dziedziczone z PartialService
}
```

---

## 35. Interfejsy a wstrzykiwanie zależności

### Pytanie 95 — interfejsy jako klucz do loose coupling

```java
interface NotificationService {
    void sendNotification(String recipient, String message);
}

class EmailNotificationService implements NotificationService {
    @Override
    public void sendNotification(String recipient, String message) {
        System.out.println("Sending email to " + recipient + ": " + message);
    }
}

class SMSNotificationService implements NotificationService {
    @Override
    public void sendNotification(String recipient, String message) {
        System.out.println("Sending SMS to " + recipient + ": " + message);
    }
}

// OrderService zależy od interfejsu, nie od konkretnej implementacji:
class OrderService {
    private final NotificationService notifier;

    // Wstrzykiwanie przez konstruktor — dependency injection
    OrderService(NotificationService notifier) {
        this.notifier = notifier;
    }

    void placeOrder(String customerId, String product) {
        // Logika zamówienia...
        notifier.sendNotification(customerId, "Order placed: " + product);
    }
}

// Elastyczne użycie:
OrderService emailService = new OrderService(new EmailNotificationService());
OrderService smsService = new OrderService(new SMSNotificationService());
```

---

## 36. Interfejsy a kontrowersje — kiedy NIE używać interfejsów

### Pytanie 96 — pułapki przy projektowaniu interfejsów

```java
// ❌ ZŁA PRAKTYKA — interfejs z metodami, które nie mają sensu dla wszystkich implementacji:
interface Animal {
    void eat();
    void fly();  // Nie każde zwierzę lata!
    void swim(); // Nie każde zwierzę pływa!
}

// ✅ LEPIEJ — Interface Segregation Principle (ISP):
interface Eatable { void eat(); }
interface Flyable { void fly(); }
interface Swimmable { void swim(); }

class Dog implements Eatable, Swimmable { // Pies je i pływa, ale nie lata
    @Override public void eat() { }
    @Override public void swim() { }
}

class Eagle implements Eatable, Flyable { // Orzeł je i lata, ale nie pływa
    @Override public void eat() { }
    @Override public void fly() { }
}

class Duck implements Eatable, Flyable, Swimmable { // Kaczka je, lata i pływa
    @Override public void eat() { }
    @Override public void fly() { }
    @Override public void swim() { }
}
```

---

## 37. Interfejsy — zaawansowane pytania egzaminacyjne

### Pytanie 97 — co się dzieje gdy klasa dziedziczy metodę i implementuje interfejs z tą samą metodą?

**Reguła: Klasa (dziedziczona metoda) wygrywa nad interfejsem (metoda default)**

```java
interface Greeter {
    default String greet() { return "Hello from interface"; }
}

class BaseGreeter {
    public String greet() { return "Hello from class"; }
}

class MyGreeter extends BaseGreeter implements Greeter {
    // greet() z BaseGreeter wygrywa nad default z Greeter
    // NIE ma konfliktu — reguła "klasa wygrywa"
}

MyGreeter g = new MyGreeter();
System.out.println(g.greet()); // "Hello from class" — nie "Hello from interface"
```

### Pytanie 98 — czy interfejs może dziedziczyć po Object?

```java
// Interfejsy NIE dziedziczą po Object — Object jest klasą, a interfejsy nie są klasami
// Ale każdy obiekt implementujący interfejs ma metody Object (toString, equals, hashCode)
// bo każdy obiekt dziedziczy po Object przez łańcuch klas

interface MyInterface {
    // Możesz DEKLAROWAĆ metody z Object, ale to nie jest dziedziczenie:
    String toString(); // deklaracja bez implementacji — nie jest dziedziczona z Object
    boolean equals(Object obj);
    int hashCode();
}
```

### Pytanie 99 — co się skompiluje, a co nie?

```java
interface I {
    void method();
}

abstract class AC implements I {
    // ✅ Nie musi implementować method() — jest abstrakcyjna
}

// ❌ Błąd — konkretna klasa nie implementuje method()
// class Concrete implements I { } // BŁĄD

// ✅ OK — implementuje method()
class Concrete implements I {
    @Override
    public void method() { }
}

// ✅ OK — klasa anonimowa implementuje method()
I anonymousImpl = new I() {
    @Override
    public void method() { System.out.println("Anonymous"); }
};
```

### Pytanie 100 — interfejsy w wyrażeniach switch (Java 21+)

```java
sealed interface Expr permits Num, Add, Mul {}
record Num(int value) implements Expr {}
record Add(Expr left, Expr right) implements Expr {}
record Mul(Expr left, Expr right) implements Expr {}

// Pattern matching w switch z sealed interface:
int eval(Expr expr) {
    return switch (expr) {
        case Num n -> n.value();
        case Add a -> eval(a.left()) + eval(a.right());
        case Mul m -> eval(m.left()) * eval(m.right());
        // Kompilator wie, że to wszystkie przypadki (sealed!) — brak default potrzebny
    };
}

// Użycie:
Expr expression = new Add(new Num(3), new Mul(new Num(4), new Num(5)));
System.out.println(eval(expression)); // 3 + (4 * 5) = 23
```

---

## Podsumowanie kluczowych zasad — ściągawka egzaminacyjna

### Najważniejsze fakty o interfejsach:

1. **Niejawne modyfikatory**: metody są `public abstract`, pola są `public static final`.
2. **Java 8**: dodano `default` i `static` metody.
3. **Java 9**: dodano `private` i `private static` metody.
4. **Java 17**: dodano `sealed` interfejsy.
5. **Konflikt default**: klasa musi nadpisać i użyć `InterfaceName.super.method()`.
6. **Klasa wygrywa**: dziedziczona metoda z klasy wygrywa nad `default` z interfejsu.
7. **Bardziej specyficzny wygrywa**: `interface B extends A` — implementacja z `B` wygrywa.
8. **Metody statyczne interfejsu** nie są dziedziczone przez implementujące klasy.
9. **@FunctionalInterface**: dokładnie jedna metoda abstrakcyjna (metody Object się nie liczą).
10. **Sealed interface**: `permits` ogranicza implementatorów; `final`/`sealed`/`non-sealed`.

### Tabela wszystkich typów metod w interfejsie:

| Typ | Java | Implementacja | Dziedziczenie | Dostęp |
|---|---|---|---|---|
| `abstract` | 1.0 | Wymagana w klasie | ✅ Tak | `public` |
| `default` | 8 | W interfejsie | ✅ Tak (można nadpisać) | `public` |
| `static` | 8 | W interfejsie | ❌ Nie | `public` |
| `private` | 9 | W interfejsie | ❌ Nie | `private` |
| `private static` | 9 | W interfejsie | ❌ Nie | `private` |
