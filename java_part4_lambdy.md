# Przewodnik egzaminacyjny Java — Część 4: Wyrażenia Lambda i Interfejsy Funkcyjne
## (pytania 101–140)

---

## 1. Składnia wyrażeń lambda

### Pytanie 101 — czym jest wyrażenie lambda?

Wyrażenie lambda to **zwięzła forma anonimowej funkcji** — implementacja interfejsu funkcyjnego bez tworzenia pełnej klasy. Wprowadzone w Java 8.

**Składnia pełna:**
```
(parametry) -> { ciało }
```

**Warianty składniowe:**

```java
// 1. Brak parametrów — puste nawiasy obowiązkowe
Runnable r = () -> System.out.println("Hello");

// 2. Jeden parametr — nawiasy opcjonalne (bez deklaracji typu)
Consumer<String> printer = s -> System.out.println(s);
Consumer<String> printerWithParens = (s) -> System.out.println(s); // też OK

// 3. Wiele parametrów — nawiasy obowiązkowe
BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;

// 4. Z deklaracją typów — nawiasy obowiązkowe
BiFunction<Integer, Integer, Integer> addTyped = (Integer a, Integer b) -> a + b;

// 5. Jedno wyrażenie — brak { } i return
Function<String, Integer> length = s -> s.length(); // return jest niejawny

// 6. Blok — { } i explicit return
Function<String, Integer> lengthBlock = s -> {
    System.out.println("Computing length of: " + s);
    return s.length(); // MUSI być return!
};

// 7. Zwracanie void — brak return
Consumer<String> log = s -> {
    System.out.println("[LOG] " + s);
    // brak return — void
};
```

**KLUCZOWE różnice składniowe:**

| Forma | Kiedy | Przykład |
|---|---|---|
| `() -> expr` | Brak parametrów, jedno wyrażenie | `() -> 42` |
| `x -> expr` | Jeden parametr bez nawiasów | `x -> x * 2` |
| `(x) -> expr` | Jeden parametr z nawiasami | `(x) -> x * 2` |
| `(x, y) -> expr` | Wiele parametrów | `(a, b) -> a + b` |
| `(Type x) -> expr` | Z typem jawnym (wtedy nawiasy wymagane) | `(String s) -> s.length()` |
| `(x, y) -> { ... }` | Blok kodu (wymagany `return`) | `(a, b) -> { return a + b; }` |

---

## 2. Interfejsy funkcyjne — java.util.function

### Pytanie 102 — pakiet java.util.function — przegląd

Java 8 wprowadził bogaty zestaw gotowych interfejsów funkcyjnych w pakiecie `java.util.function`:

```
Podstawowe:
├── Function<T, R>         — T → R (przekształcenie)
├── Predicate<T>           — T → boolean (test/filtrowanie)
├── Consumer<T>            — T → void (konsumpcja/side effect)
└── Supplier<T>            — () → T (produkcja/dostarczanie)

Dwuargumentowe:
├── BiFunction<T, U, R>    — (T, U) → R
├── BiPredicate<T, U>      — (T, U) → boolean
└── BiConsumer<T, U>       — (T, U) → void

Specjalizowane (UnaryOperator/BinaryOperator):
├── UnaryOperator<T>       — T → T (extends Function<T,T>)
└── BinaryOperator<T>      — (T, T) → T (extends BiFunction<T,T,T>)

Prymitywne (wydajne, bez autoboxingu):
├── IntFunction<R>         — int → R
├── ToIntFunction<T>       — T → int
├── IntUnaryOperator       — int → int
├── IntBinaryOperator      — (int, int) → int
└── ... (analogicznie dla long, double)
```

---

## 3. Function<T, R>

### Pytanie 103 — Function — transformacja wartości

```java
import java.util.function.Function;

// Function<T, R>: przyjmuje T, zwraca R
Function<String, Integer> stringToLength = s -> s.length();
Function<String, String> toUpper = String::toUpperCase; // method reference

// Wywołanie:
Integer len = stringToLength.apply("Hello"); // 5

// Chaining — andThen() i compose():
Function<Integer, Integer> doubleIt = x -> x * 2;
Function<Integer, Integer> addThree = x -> x + 3;

// andThen: najpierw doubleIt, potem addThree
Function<Integer, Integer> doubleAndAdd = doubleIt.andThen(addThree);
doubleAndAdd.apply(5); // (5*2) + 3 = 13

// compose: najpierw addThree, potem doubleIt (odwrotna kolejność!)
Function<Integer, Integer> addAndDouble = doubleIt.compose(addThree);
addAndDouble.apply(5); // (5+3) * 2 = 16
```

**WAŻNE — różnica andThen vs compose:**

```java
// Niech f = doubleIt, g = addThree
// f.andThen(g) = g(f(x)) — najpierw f, potem g
// f.compose(g) = f(g(x)) — najpierw g, potem f (matematyczna kompozycja)

Function<Integer, Integer> f = x -> x * 2;   // podwój
Function<Integer, Integer> g = x -> x + 10;  // dodaj 10

System.out.println(f.andThen(g).apply(5)); // (5*2)+10 = 20
System.out.println(f.compose(g).apply(5)); // (5+10)*2 = 30
```

---

## 4. Predicate<T>

### Pytanie 104 — Predicate — testowanie warunków

```java
import java.util.function.Predicate;

Predicate<String> isLong = s -> s.length() > 5;
Predicate<String> startsWithA = s -> s.startsWith("A");
Predicate<Integer> isEven = n -> n % 2 == 0;

// Wywołanie:
boolean result = isLong.test("Hello World"); // true

// Kompozycja:
// and() — oba muszą być true
Predicate<String> isLongAndStartsWithA = isLong.and(startsWithA);
isLongAndStartsWithA.test("Algorithm"); // true (długość > 5 AND startuje z A)

// or() — przynajmniej jeden true
Predicate<String> isLongOrStartsWithA = isLong.or(startsWithA);
isLongOrStartsWithA.test("Art"); // true (nie jest długie, ALE startuje z A)

// negate() — negacja
Predicate<String> isShort = isLong.negate();
isShort.test("Hi"); // true

// Predicate.not() — statyczna metoda (Java 11+)
Predicate<String> notEmpty = Predicate.not(String::isEmpty);

// Predicate.isEqual() — tworzy Predicate sprawdzający równość
Predicate<String> isHello = Predicate.isEqual("Hello");
isHello.test("Hello"); // true
isHello.test("World"); // false

// Użycie w Stream:
List<String> names = List.of("Alice", "Bob", "Anna", "Charlie");
names.stream()
     .filter(isLong.and(startsWithA))
     .forEach(System.out::println); // Alice, Anna? sprawdź: Alice.length()=5 (nie>5)
                                     // Anna.length()=4 → żadna nie przejdzie!
```

---

## 5. Consumer<T>

### Pytanie 105 — Consumer — efekty uboczne

```java
import java.util.function.Consumer;

// Consumer<T>: przyjmuje T, zwraca void (efekt uboczny)
Consumer<String> printer = System.out::println;
Consumer<String> logger = s -> System.out.println("[LOG] " + s);

// Wywołanie:
printer.accept("Hello"); // Hello

// andThen() — łańcuchowanie Consumerów:
Consumer<String> logThenPrint = logger.andThen(printer);
logThenPrint.accept("Message");
// Wynik:
// [LOG] Message
// Message

// BiConsumer<T, U>: przyjmuje dwa argumenty, zwraca void
BiConsumer<String, Integer> printWithIndex = (s, i) -> 
    System.out.println(i + ": " + s);
printWithIndex.accept("Alice", 1); // "1: Alice"

// Typowe użycie — forEach w List i Map:
List<String> items = List.of("a", "b", "c");
items.forEach(printer); // odpowiednik: for (String s : items) printer.accept(s);

Map<String, Integer> scores = Map.of("Alice", 90, "Bob", 85);
scores.forEach((name, score) -> System.out.println(name + ": " + score));
// BiConsumer w Map.forEach!
```

---

## 6. Supplier<T>

### Pytanie 106 — Supplier — leniwe dostarczanie wartości

```java
import java.util.function.Supplier;

// Supplier<T>: brak argumentów, zwraca T
Supplier<String> greeting = () -> "Hello, World!";
Supplier<List<String>> listFactory = ArrayList::new; // constructor reference

// Wywołanie:
String msg = greeting.get(); // "Hello, World!"
List<String> list = listFactory.get(); // nowa, pusta ArrayList

// Supplier do leniwego obliczania wartości:
Supplier<Double> expensiveComputation = () -> {
    System.out.println("Computing...");
    return Math.PI * 1000; // przykład długiego obliczenia
};

// Wartość NIE jest obliczana do momentu wywołania get():
// expensiveComputation — nic nie wypisuje
Double value = expensiveComputation.get(); // dopiero teraz: "Computing..."

// Optional.orElseGet() — Supplier do leniwego fallback:
Optional<String> opt = Optional.empty();
// ❌ ZŁE — eager: wartość obliczana zawsze, nawet gdy Optional nie jest pusty
String badFallback = opt.orElse(createExpensiveDefault()); // createExpensiveDefault() wywołana zawsze

// ✅ DOBRE — lazy: Supplier wywoływany tylko gdy Optional pusty
String goodFallback = opt.orElseGet(() -> createExpensiveDefault()); // lazy!
```

---

## 7. BiFunction, BiPredicate, BiConsumer

### Pytanie 107 — warianty dwuargumentowe

```java
// BiFunction<T, U, R>: (T, U) -> R
BiFunction<String, Integer, String> repeat = (s, n) -> s.repeat(n);
repeat.apply("abc", 3); // "abcabcabc"

// andThen() dla BiFunction:
BiFunction<Integer, Integer, Integer> sum = (a, b) -> a + b;
Function<Integer, String> intToStr = i -> "Result: " + i;
BiFunction<Integer, Integer, String> sumAndFormat = sum.andThen(intToStr);
sumAndFormat.apply(3, 4); // "Result: 7"

// BiPredicate<T, U>: (T, U) -> boolean
BiPredicate<String, Integer> longerThan = (s, n) -> s.length() > n;
longerThan.test("Hello", 3); // true

// and(), or(), negate() działają tak samo jak w Predicate:
BiPredicate<Integer, Integer> bothPositive = (a, b) -> a > 0 && b > 0;
BiPredicate<Integer, Integer> eitherNegative = bothPositive.negate();

// BiConsumer<T, U>: (T, U) -> void
BiConsumer<String, String> fullName = (first, last) -> 
    System.out.println("Name: " + first + " " + last);
fullName.accept("John", "Doe"); // "Name: John Doe"

// andThen() dla BiConsumer:
BiConsumer<String, String> logAndPrint = 
    ((BiConsumer<String, String>) (f, l) -> System.out.println("[LOG] " + f + " " + l))
    .andThen(fullName);
```

---

## 8. UnaryOperator i BinaryOperator

### Pytanie 108 — operatory jako specjalizacje Function

```java
import java.util.function.UnaryOperator;
import java.util.function.BinaryOperator;

// UnaryOperator<T> extends Function<T, T>: T -> T (ten sam typ in i out)
UnaryOperator<String> toUpper = String::toUpperCase;
UnaryOperator<Integer> square = x -> x * x;
UnaryOperator<List<String>> sort = list -> { 
    List<String> sorted = new ArrayList<>(list);
    Collections.sort(sorted);
    return sorted;
};

toUpper.apply("hello"); // "HELLO"
square.apply(5);        // 25

// BinaryOperator<T> extends BiFunction<T, T, T>: (T, T) -> T
BinaryOperator<Integer> max = (a, b) -> a > b ? a : b;
BinaryOperator<String> concat = (a, b) -> a + b;
BinaryOperator<Integer> add = Integer::sum; // method reference

max.apply(3, 7);    // 7
concat.apply("Hello ", "World"); // "Hello World"

// Specjalne metody statyczne:
BinaryOperator<Integer> maxByCmp = BinaryOperator.maxBy(Integer::compare);
BinaryOperator<Integer> minByCmp = BinaryOperator.minBy(Integer::compare);
maxByCmp.apply(10, 20); // 20
minByCmp.apply(10, 20); // 10

// UnaryOperator.identity() — returns its input unchanged:
UnaryOperator<String> identity = UnaryOperator.identity();
identity.apply("anything"); // "anything"
```

---

## 9. Method References (referencje do metod)

### Pytanie 109 — cztery rodzaje referencji do metod

Referencje do metod (`::`) to skrócony zapis lambdy, gdy lambda tylko wywołuje istniejącą metodę:

```java
// Składnia: ClassName::methodName lub instance::methodName

// 1. STATYCZNA metoda: ClassName::staticMethod
// Odpowiednik: (args) -> ClassName.staticMethod(args)
Function<String, Integer> parseInt = Integer::parseInt;   // s -> Integer.parseInt(s)
BiFunction<Integer, Integer, Integer> sum = Integer::sum; // (a, b) -> Integer.sum(a, b)
Consumer<String> print = System.out::println;             // s -> System.out.println(s)

parseInt.apply("42"); // 42

// 2. INSTANCYJNA metoda konkretnego obiektu: instance::method
String prefix = "Hello, ";
Function<String, String> greet = prefix::concat; // s -> prefix.concat(s)
greet.apply("World"); // "Hello, World"

// 3. INSTANCYJNA metoda dowolnego obiektu (przez typ): ClassName::instanceMethod
// Pierwszy parametr lambdy staje się "this"
Function<String, String> toUpper = String::toUpperCase; // s -> s.toUpperCase()
Function<String, Integer> length = String::length;       // s -> s.length()
BiPredicate<String, String> startsWith = String::startsWith; // (s, prefix) -> s.startsWith(prefix)

toUpper.apply("hello"); // "HELLO"
startsWith.test("Hello", "He"); // true

// 4. KONSTRUKTOR: ClassName::new
Supplier<ArrayList<String>> listMaker = ArrayList::new;    // () -> new ArrayList<>()
Function<String, StringBuilder> sbMaker = StringBuilder::new; // s -> new StringBuilder(s)
BiFunction<String, Integer, String> repeatMaker = String::new; // skomplikowane — rzadkie

ArrayList<String> list = listMaker.get();
StringBuilder sb = sbMaker.apply("hello");
```

**Kiedy można użyć method reference:**

```java
// ✅ lambda wywołuje tylko jedną metodę — można użyć ::
list.stream().map(s -> s.toUpperCase())  // można zamienić na:
list.stream().map(String::toUpperCase);

list.stream().filter(s -> s.isEmpty())   // można zamienić na:
list.stream().filter(String::isEmpty);

// ✅ lambda wywołuje metodę z jednym parametrem (który jest samym obiektem)
list.forEach(s -> System.out.println(s)); // można zamienić na:
list.forEach(System.out::println);

// ❌ NIE można użyć :: gdy lambda robi więcej:
list.stream().map(s -> s.toUpperCase() + "!"); // nie można uproscić
list.stream().filter(s -> s.length() > 5);     // nie można uprościć (to predicate na dwóch args)
```

---

## 10. Effectively final — zamknięcia (closures)

### Pytanie 110 — co oznacza "effectively final"?

Lambda może używać zmiennych z otaczającego zakresu, ale tylko jeśli są **effectively final** — nie zmieniane po inicjalizacji (nawet bez słowa `final`):

```java
int threshold = 10; // effectively final — nigdy nie zmieniana po inicjalizacji

Predicate<Integer> isAbove = n -> n > threshold; // ✅ OK — threshold jest effectively final

// ❌ BŁĄD — threshold nie jest effectively final (jest modyfikowana):
int counter = 0;
Runnable incrementer = () -> counter++; // ❌ BŁĄD KOMPILACJI
// "Variable used in lambda expression should be final or effectively final"

// Obejście: użyj AtomicInteger lub tablicy jednoelementowej:
int[] counterArr = {0};
Runnable incrementer2 = () -> counterArr[0]++; // ✅ OK — referencja do tablicy jest final, jej zawartość nie

java.util.concurrent.atomic.AtomicInteger atomicCounter = new java.util.concurrent.atomic.AtomicInteger(0);
Runnable incrementer3 = () -> atomicCounter.incrementAndGet(); // ✅ OK

// Pola instancji klasy NIE muszą być effectively final:
class Counter {
    private int count = 0;

    Runnable createIncrementer() {
        return () -> count++; // ✅ OK — count to pole, nie zmienna lokalna
    }
}
```

**Dlaczego to ograniczenie istnieje?**

Lambda może "żyć" dłużej niż metoda, w której została stworzona. Gdy metoda się zakończy, jej zmienne lokalne znikają ze stosu. Lambda musi trzymać **kopię** wartości zmiennej — dlatego wartość musi być stała (effectively final). Gdyby wartość mogła się zmienić po stworzeniu lambdy, kopia byłaby nieaktualna (race condition).

---

## 11. Chaining — łączenie funkcji

### Pytanie 111 — metody kompozycji interfejsów funkcyjnych

```java
// Function.andThen() i compose() — już omówione w pyt. 103
// Predicate.and(), or(), negate() — już omówione w pyt. 104
// Consumer.andThen() — już omówione w pyt. 105

// ŁAŃCUCH FUNCTION:
Function<String, String> step1 = String::trim;
Function<String, String> step2 = String::toUpperCase;
Function<String, String> step3 = s -> "[" + s + "]";
Function<String, Integer> step4 = String::length;

// andThen tworzy nową funkcję:
Function<String, Integer> pipeline = step1.andThen(step2).andThen(step3).andThen(step4);
pipeline.apply("  hello  "); // trim → "hello" → "HELLO" → "[HELLO]" → 7

// ŁAŃCUCH PREDICATE — złożone warunki:
Predicate<String> notNull = s -> s != null;
Predicate<String> notEmpty = s -> !s.isEmpty();
Predicate<String> longEnough = s -> s.length() >= 3;
Predicate<String> noSpaces = s -> !s.contains(" ");

Predicate<String> validUsername = notNull
    .and(notEmpty)
    .and(longEnough)
    .and(noSpaces);

validUsername.test("alice");     // true
validUsername.test("a b");       // false (zawiera spację)
validUsername.test("");          // false (pusta)
validUsername.test(null);        // false (null)

// ŁAŃCUCH CONSUMER — sekwencja operacji:
Consumer<String> validate = s -> System.out.println("Validating: " + s);
Consumer<String> process = s -> System.out.println("Processing: " + s);
Consumer<String> audit = s -> System.out.println("Auditing: " + s);

Consumer<String> pipeline2 = validate.andThen(process).andThen(audit);
pipeline2.accept("data"); // wykona trzy operacje po kolei
```

---

## 12. Obsługa wyjątków w lambdach

### Pytanie 112 — checked exceptions w lambdach

Standardowe interfejsy funkcyjne `java.util.function.*` **nie deklarują** checked exceptions. To problem gdy próbujemy użyć metody rzucającej checked exception w lambdzie:

```java
// ❌ PROBLEM — Files.readString rzuca IOException (checked)
List<Path> paths = List.of(Path.of("a.txt"), Path.of("b.txt"));
// paths.stream().map(p -> Files.readString(p)); // ❌ BŁĄD KOMPILACJI

// ✅ ROZWIĄZANIE 1 — try-catch wewnątrz lambdy:
paths.stream().map(p -> {
    try {
        return Files.readString(p);
    } catch (IOException e) {
        throw new RuntimeException(e); // zawiń w unchecked
    }
}).forEach(System.out::println);

// ✅ ROZWIĄZANIE 2 — własny interfejs funkcyjny z checked exception:
@FunctionalInterface
interface ThrowingFunction<T, R> {
    R apply(T t) throws Exception;
}

// Metoda wrappująca:
static <T, R> Function<T, R> wrap(ThrowingFunction<T, R> f) {
    return t -> {
        try {
            return f.apply(t);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    };
}

// Użycie:
paths.stream()
     .map(wrap(p -> Files.readString(p)))
     .forEach(System.out::println);

// ✅ ROZWIĄZANIE 3 — biblioteka Vavr lub podobna (funkcyjne try):
// Try.of(() -> Files.readString(path)).getOrElse("error")
```

---

## 13. Interfejsy funkcyjne w Collections

### Pytanie 113 — lambdy z metodami Collection

```java
List<String> names = new ArrayList<>(List.of("Charlie", "Alice", "Bob", "David"));

// 1. sort() z Comparator — BiFunction-like interface
names.sort((a, b) -> a.compareTo(b));               // String::compareTo — method reference
names.sort(Comparator.naturalOrder());              // equivalent
names.sort(Comparator.comparing(String::length));  // sortuj po długości
names.sort(Comparator.comparing(String::length).reversed()); // malejąco

// 2. forEach() z Consumer
names.forEach(System.out::println);                 // Consumer<String>
names.forEach(name -> System.out.println("Hi, " + name));

// 3. removeIf() z Predicate
names.removeIf(s -> s.startsWith("A"));            // usuń zaczynające się na A
names.removeIf(String::isEmpty);                   // usuń puste

// 4. replaceAll() z UnaryOperator
names.replaceAll(String::toUpperCase);             // zamień każdy element na uppercase
names.replaceAll(s -> s + "!");                   // dodaj ! do każdego

// Map operations:
Map<String, Integer> scores = new HashMap<>();
scores.put("Alice", 90);
scores.put("Bob", 85);

// 5. Map.forEach() z BiConsumer
scores.forEach((name, score) -> System.out.println(name + ": " + score));

// 6. Map.replaceAll() z BiFunction
scores.replaceAll((name, score) -> score + 10); // dodaj 10 do każdego wyniku

// 7. Map.compute() z BiFunction
scores.compute("Alice", (key, val) -> val == null ? 100 : val + 5);

// 8. Map.computeIfAbsent() z Function
scores.computeIfAbsent("Charlie", key -> 75); // dodaj Charlie ze wynikiem 75

// 9. Map.merge() z BiFunction
scores.merge("Alice", 5, Integer::sum); // dodaj 5 do Alice (lub wstaw 5 jeśli brak)
```

---

## 14. Currying i partial application

### Pytanie 114 — currying z lambdami

**Currying** to przekształcenie funkcji wielu argumentów w łańcuch funkcji jednoargumentowych:

```java
// Normalna funkcja (3 argumenty):
// add(a, b, c) = a + b + c

// Curried version w Javie:
Function<Integer, Function<Integer, Function<Integer, Integer>>> curriedAdd =
    a -> b -> c -> a + b + c;

// Użycie:
int result = curriedAdd.apply(1).apply(2).apply(3); // 6

// Partial application — "zamrożenie" jednego argumentu:
Function<Integer, Function<Integer, Integer>> add1 = curriedAdd.apply(1); // a=1 "zamrożone"
Function<Integer, Integer> add1and2 = add1.apply(2); // a=1, b=2 "zamrożone"
int final2 = add1and2.apply(3); // 6

// Praktyczny przykład — tworzenie validatorów przez currying:
Function<Integer, Function<Integer, Boolean>> between =
    min -> max -> value -> value >= min && value <= max;

Function<Integer, Boolean> validAge = between.apply(0).apply(120);
Function<Integer, Boolean> validScore = between.apply(0).apply(100);

validAge.apply(25);   // true
validAge.apply(-5);   // false
validScore.apply(85); // true
validScore.apply(150);// false

// BiFunction do Function<Function> — klasyczny currying pattern:
BiFunction<String, Integer, String> repeat = (s, n) -> s.repeat(n);

// Zcurrowany:
Function<String, Function<Integer, String>> curriedRepeat =
    s -> n -> s.repeat(n);

Function<Integer, String> repeatHello = curriedRepeat.apply("Hello");
repeatHello.apply(3); // "HelloHelloHello"
```

---

## 15. Lambda vs klasa anonimowa — kluczowe różnice

### Pytanie 115 — kiedy lambda, kiedy klasa anonimowa?

```java
// KLASA ANONIMOWA — stary styl (przed Java 8):
Runnable runnableAnon = new Runnable() {
    @Override
    public void run() {
        System.out.println("Running (anonymous)");
    }
};

// LAMBDA — nowy styl (Java 8+):
Runnable runnableLambda = () -> System.out.println("Running (lambda)");
```

**Kluczowe różnice:**

| Aspekt | Klasa anonimowa | Lambda |
|---|---|---|
| Typ (`this`) | `this` = instancja klasy anonimowej | `this` = otaczająca klasa |
| Własny stan | ✅ Może mieć pola | ❌ Brak |
| Implementacja interfejsów | Dowolny interfejs (też wielometodowy) | Tylko interfejsy funkcyjne (SAM) |
| Rozszerzanie klas | ✅ Może rozszerzać klasy | ❌ Nie może |
| Serializacja | Możliwa (z ograniczeniami) | Technicznie możliwa, ale niezalecana |
| Kompilacja | Osobny plik `.class` | Dynamiczne wywołanie (`invokedynamic`) |
| Shadow outer vars | ✅ Może deklarować zmienną o tej samej nazwie | ❌ Nie może (jest w tym samym scope) |

```java
// RÓŻNICA this — ważne na egzaminie!
class OuterClass {
    private String name = "Outer";

    void demonstrate() {
        // Klasa anonimowa — this to instancja klasy anonimowej:
        Runnable anon = new Runnable() {
            private String name = "Anonymous";
            @Override
            public void run() {
                System.out.println(this.name);        // "Anonymous"
                System.out.println(OuterClass.this.name); // "Outer"
            }
        };

        // Lambda — this to OuterClass:
        Runnable lambda = () -> {
            System.out.println(this.name); // "Outer" — this = OuterClass
            // Lambda nie ma własnego 'this'
        };
    }
}

// RÓŻNICA shadow variables:
String x = "outer";

// Klasa anonimowa MOŻE zadeklarować x — shadow:
Runnable anon = new Runnable() {
    String x = "inner"; // ✅ OK — shadow
    @Override public void run() { System.out.println(x); } // "inner"
};

// Lambda NIE MOŻE — ten sam scope:
// Runnable lambda = () -> { String x = "inner"; }; // ❌ BŁĄD — x już istnieje
```

---

## 16. Interfejsy funkcyjne — Comparator

### Pytanie 116 — Comparator jako interfejs funkcyjny

```java
// Comparator<T> jest interfejsem funkcyjnym (ma jedną metodę compare())
// Posiada też wiele metod default i static:

// Tworzenie przez lambdę:
Comparator<String> byLength = (s1, s2) -> s1.length() - s2.length();
// Lepiej (unika overflow z Integer):
Comparator<String> byLengthSafe = Comparator.comparingInt(String::length);

// Chaining comparatorów:
Comparator<String> byLengthThenAlpha = Comparator
    .comparingInt(String::length)       // najpierw po długości
    .thenComparing(Comparator.naturalOrder()); // potem alfabetycznie

// reversed():
Comparator<String> byLengthDesc = Comparator
    .comparingInt(String::length)
    .reversed();

// Null-safe:
Comparator<String> nullSafe = Comparator.nullsFirst(Comparator.naturalOrder());
Comparator<String> nullsLast = Comparator.nullsLast(Comparator.naturalOrder());

// Przykład użycia:
List<String> words = new ArrayList<>(List.of("banana", "apple", "cherry", "date"));
words.sort(byLengthThenAlpha);
System.out.println(words); // [date, apple, banana, cherry]

// Sortowanie obiektów złożonych:
record Person(String name, int age) {}

List<Person> people = List.of(
    new Person("Alice", 30),
    new Person("Bob", 25),
    new Person("Charlie", 30)
);

people.stream()
    .sorted(Comparator.comparingInt(Person::age)
                      .thenComparing(Person::name))
    .forEach(p -> System.out.println(p.name() + ": " + p.age()));
// Bob: 25, Alice: 30, Charlie: 30
```

---

## 17. Primitive functional interfaces

### Pytanie 117 — interfejsy dla typów prymitywnych

Java dostarcza wyspecjalizowane interfejsy dla `int`, `long`, `double` — unikają autoboxingu/unboxingu:

```java
// ZAMIAST Function<Integer, Integer> (autoboxing!):
java.util.function.IntUnaryOperator squareInt = x -> x * x;
squareInt.applyAsInt(5); // 25 — bez autoboxingu!

// IntFunction<R>: int -> R
java.util.function.IntFunction<String> intToStr = i -> "Number: " + i;
intToStr.apply(42); // "Number: 42"

// ToIntFunction<T>: T -> int
java.util.function.ToIntFunction<String> strToLen = String::length;
strToLen.applyAsInt("Hello"); // 5

// IntPredicate: int -> boolean
java.util.function.IntPredicate isPositive = n -> n > 0;
isPositive.test(5); // true

// IntConsumer: int -> void
java.util.function.IntConsumer printInt = n -> System.out.println("int: " + n);

// IntSupplier: () -> int
java.util.function.IntSupplier randomInt = () -> (int)(Math.random() * 100);

// IntBinaryOperator: (int, int) -> int
java.util.function.IntBinaryOperator maxInt = Math::max;
maxInt.applyAsInt(3, 7); // 7

// Analogicznie: LongUnaryOperator, DoubleUnaryOperator, etc.

// Konwersje między nimi:
IntUnaryOperator doubleIt = x -> x * 2;
// Konwersja na Function<Integer, Integer>:
Function<Integer, Integer> asFunction = doubleIt::applyAsInt; // autoboxing w metodzie
```

---

## 18. Lambdy a serializacja

### Pytanie 118 — czy lambdy można serializować?

```java
// Lambda może implementować Serializable:
import java.io.Serializable;
import java.util.function.Function;

// Rzutowanie na dwa interfejsy jednocześnie (intersection type):
Function<String, String> serializableLambda = 
    (Function<String, String> & Serializable) String::toUpperCase;

// Problem: serializacja lambd jest skomplikowana i zależy od JVM.
// Klasa, w której lambda jest zdefiniowana, musi być dostępna po deserializacji.
// Ogólnie: lambdy NIE są zaprojektowane do serializacji.
// Zamiast tego: użyj serializowalnej klasy anonimowej lub innego mechanizmu.

// Praktyczna zasada: unikaj serializacji lambd w kodzie produkcyjnym.
```

---

## 19. Interfejsy funkcyjne — zaawansowane kompozycje

### Pytanie 119 — tworzenie pipeline'ów transformacji

```java
// Wzorzec pipeline z Function:
class DataPipeline<T> {
    private final Function<T, T> pipeline;

    DataPipeline(Function<T, T> initialStep) {
        this.pipeline = initialStep;
    }

    DataPipeline<T> then(Function<T, T> nextStep) {
        return new DataPipeline<>(pipeline.andThen(nextStep));
    }

    T execute(T input) {
        return pipeline.apply(input);
    }
}

// Użycie:
DataPipeline<String> processor = new DataPipeline<>(String::trim)
    .then(String::toUpperCase)
    .then(s -> s.replace(" ", "_"))
    .then(s -> "[" + s + "]");

processor.execute("  hello world  "); // "[HELLO_WORLD]"

// Bardziej funkcyjny styl — reduce z Function:
List<Function<Integer, Integer>> transforms = List.of(
    x -> x + 1,
    x -> x * 2,
    x -> x - 3
);

Function<Integer, Integer> combined = transforms.stream()
    .reduce(Function.identity(), Function::andThen);
combined.apply(5); // (5+1)*2-3 = 9
```

---

## 20. Interfejsy funkcyjne w praktyce — wzorce projektowe

### Pytanie 120 — Strategy Pattern z lambdami

```java
// Wzorzec Strategy zastąpiony lambdami:
// STARY STYL — hierarchia klas:
interface SortStrategy { List<Integer> sort(List<Integer> list); }
class BubbleSort implements SortStrategy { ... }
class QuickSort implements SortStrategy { ... }

// NOWY STYL — lambda jako strategia:
@FunctionalInterface
interface SortStrategy {
    List<Integer> sort(List<Integer> list);
}

class Sorter {
    private SortStrategy strategy;
    
    Sorter(SortStrategy strategy) { this.strategy = strategy; }
    
    List<Integer> sort(List<Integer> list) { return strategy.sort(list); }
}

// Używamy lambd jako strategii:
Sorter ascendingSorter = new Sorter(list -> {
    List<Integer> sorted = new ArrayList<>(list);
    Collections.sort(sorted);
    return sorted;
});

Sorter reverseSorter = new Sorter(list -> {
    List<Integer> sorted = new ArrayList<>(list);
    sorted.sort(Comparator.reverseOrder());
    return sorted;
});

// Command Pattern z lambdami:
interface Command { void execute(); }

class CommandProcessor {
    private final List<Command> commands = new ArrayList<>();
    
    void addCommand(Command command) { commands.add(command); }
    void executeAll() { commands.forEach(Command::execute); }
}

CommandProcessor processor = new CommandProcessor();
processor.addCommand(() -> System.out.println("Command 1"));
processor.addCommand(() -> System.out.println("Command 2"));
processor.executeAll();
```

---

## 21. Interfejsy funkcyjne — Runnable i Callable

### Pytanie 121 — Runnable vs Callable

```java
// Runnable: () -> void (nie zwraca wartości, nie rzuca checked exceptions)
@FunctionalInterface
public interface Runnable {
    void run();
}

// Callable<V>: () -> V (zwraca wartość, może rzucać checked exceptions)
@FunctionalInterface
public interface Callable<V> {
    V call() throws Exception;
}

// Użycie z ExecutorService:
ExecutorService executor = Executors.newFixedThreadPool(2);

// Runnable — nie mamy dostępu do wyniku:
executor.submit(() -> System.out.println("Running task"));

// Callable — Future do pobrania wyniku:
Future<Integer> future = executor.submit(() -> {
    Thread.sleep(1000); // może rzucić InterruptedException (checked)
    return 42;
});

Integer result = future.get(); // blokuje do ukończenia
System.out.println(result); // 42

executor.shutdown();
```

---

## 22. Interfejsy funkcyjne — zaawansowane wzorce

### Pytanie 122 — memoizacja z lambdami

```java
// Memoizacja — cachowanie wyników funkcji:
static <T, R> Function<T, R> memoize(Function<T, R> function) {
    Map<T, R> cache = new HashMap<>();
    return input -> cache.computeIfAbsent(input, function);
}

// Użycie:
Function<Integer, Long> fibonacci = memoize(n -> {
    if (n <= 1) return (long) n;
    // UWAGA: rekurencja z memoizacją wymaga triku z tablicą/mapą zewnętrzną
    return fibonacci.apply(n - 1) + fibonacci.apply(n - 2);
});

// Prostsza memoizacja:
Map<Integer, Long> fibCache = new HashMap<>();
Function<Integer, Long> fib = n -> fibCache.computeIfAbsent(n, k -> {
    if (k <= 1) return (long) k;
    return fibCache.get(k - 1) + fibCache.get(k - 2); // zakłada że mniejsze już w cache
});
```

---

## 23. Interfejsy funkcyjne — kompozycja Predicate

### Pytanie 123 — zaawansowane łączenie Predicate

```java
// Budowanie złożonych warunków z małych Predicate:
record Product(String name, double price, String category, int stock) {}

Predicate<Product> inStock = p -> p.stock() > 0;
Predicate<Product> affordable = p -> p.price() < 100.0;
Predicate<Product> isElectronics = p -> "Electronics".equals(p.category());
Predicate<Product> highValue = p -> p.price() > 500.0;

// Złożone warunki:
Predicate<Product> bargain = inStock.and(affordable);
Predicate<Product> expensiveOrElec = highValue.or(isElectronics);
Predicate<Product> notOutOfStock = inStock.negate();

// Dynamiczne budowanie Predicate:
List<Predicate<Product>> filters = new ArrayList<>();
filters.add(inStock);
filters.add(affordable);

// Wszystkie warunki muszą być spełnione:
Predicate<Product> combined = filters.stream()
    .reduce(p -> true, Predicate::and);

// Przynajmniej jeden warunek musi być spełniony:
Predicate<Product> anyMatch = filters.stream()
    .reduce(p -> false, Predicate::or);

List<Product> products = List.of(
    new Product("Laptop", 999.99, "Electronics", 5),
    new Product("Mouse", 29.99, "Electronics", 0),
    new Product("Desk", 49.99, "Furniture", 3)
);

products.stream()
    .filter(combined)
    .forEach(p -> System.out.println(p.name())); // "Desk" (in stock AND affordable)
```

---

## 24. Interfejsy funkcyjne — wydajność

### Pytanie 124 — lambdy a wydajność w porównaniu z pętlami

```java
// Lambdy/streamy kontra pętle — kiedy co?
int[] numbers = IntStream.rangeClosed(1, 1_000_000).toArray();

// ✅ Pętla for — najwydajniejsza dla prostych operacji na prymitywach:
long sumLoop = 0;
for (int n : numbers) {
    sumLoop += n;
}

// ✅ IntStream.sum() — porównywalna wydajność bo unika boxingu:
long sumStream = IntStream.of(numbers).sum();

// ⚠️ Potencjalnie wolniejsze — Stream<Integer> z autoboxingiem:
// long sumBoxed = Arrays.stream(numbers).boxed().reduce(0, Integer::sum);
// LEPIEJ użyć Arrays.stream(numbers).sum() — primitive stream

// Kiedy lambda/stream jest dobra:
// 1. Czytelność > wydajność (drobne różnice w większości przypadków)
// 2. Parallel streams dla naprawdę dużych danych
// 3. Kompozycja i reużywalność logiki

// Parallel stream — kiedy warto?
long sumParallel = IntStream.of(numbers).parallel().sum(); // wiele CPU
// Uwaga: parallel ma overhead — używaj tylko dla dużych zbiorów i kosztownych operacji
```

---

## 25. Method references — szczegółowe przypadki

### Pytanie 125 — niuanse referencji do metod

```java
// Przypadek specjalny: metoda instancyjna z dodatkowym parametrem
class StringHelper {
    public boolean startsWithPrefix(String prefix) {
        return "Hello".startsWith(prefix);
    }
}

StringHelper helper = new StringHelper();
// instance::method — helper jako "this":
Predicate<String> startsWithFn = helper::startsWithPrefix;
// lambdą: prefix -> helper.startsWithPrefix(prefix)

// ClassName::instanceMethod — pierwszy argument staje się "this":
// String::startsWith — (s, prefix) -> s.startsWith(prefix)
BiPredicate<String, String> biStartsWith = String::startsWith;
biStartsWith.test("Hello", "He"); // true

// Konstruktor tablicy:
java.util.function.IntFunction<String[]> arrayMaker = String[]::new;
String[] arr = arrayMaker.apply(5); // new String[5]

// Konstruktor z parametrami — dopasowanie do sygnatury:
// Person(String name, int age) → BiFunction<String, Integer, Person>
BiFunction<String, Integer, Person> personMaker = Person::new;
Person p = personMaker.apply("Alice", 30);

// Referencja do metody statycznej z Object:
// Objects::requireNonNull — Function<T, T>
Function<String, String> requireNonNull = java.util.Objects::requireNonNull;
String result = requireNonNull.apply("hello"); // "hello" (lub NullPointerException)
```

---

## 26. Interfejsy funkcyjne — operatory na kolekcjach

### Pytanie 126 — funkcje wyższego rzędu

```java
// Funkcja przyjmująca funkcję jako argument — HOF (Higher-Order Function):
static <T, R> List<R> transform(List<T> list, Function<T, R> mapper) {
    return list.stream().map(mapper).collect(Collectors.toList());
}

static <T> List<T> filterList(List<T> list, Predicate<T> predicate) {
    return list.stream().filter(predicate).collect(Collectors.toList());
}

// Funkcja zwracająca funkcję:
static Function<Integer, Integer> multiplierBy(int factor) {
    return n -> n * factor; // closure — factor jest captured
}

Function<Integer, Integer> triple = multiplierBy(3);
Function<Integer, Integer> quadruple = multiplierBy(4);
triple.apply(5);   // 15
quadruple.apply(5); // 20

// Użycie:
List<String> names = List.of("alice", "bob", "charlie");
List<String> upperNames = transform(names, String::toUpperCase);
List<String> longNames = filterList(names, s -> s.length() > 4);
```

---

## 27. Interfejsy funkcyjne — edge cases egzaminacyjne

### Pytanie 127 — co się kompiluje?

```java
// Sprawdzenie co jest interfejsem funkcyjnym:

// ✅ Jest — jedna metoda abstrakcyjna:
@FunctionalInterface
interface F1 { void go(); }

// ✅ Jest — metody default i static nie liczą się:
@FunctionalInterface
interface F2 {
    void go();
    default void extra() {}
    static void helper() {}
}

// ✅ Jest — metody z Object nie liczą się:
@FunctionalInterface
interface F3 {
    void go();
    String toString(); // z Object — nie liczy się
    boolean equals(Object o); // z Object — nie liczy się
}

// ✅ Jest — dziedziczy jedna metoda abstrakcyjna:
interface Parent { void go(); }
@FunctionalInterface
interface F4 extends Parent { } // dziedziczy go() z Parent — jedna metoda abstrakcyjna

// ❌ NIE jest — dwie metody abstrakcyjne:
// @FunctionalInterface — BŁĄD KOMPILACJI
interface NotFunctional {
    void method1();
    void method2(); // dwie abstrakcyjne = nie jest SAM
}

// ❌ NIE jest — interfejs pusty (zero metod abstrakcyjnych):
// @FunctionalInterface — BŁĄD KOMPILACJI
interface AlsoNotFunctional { } // zero metod abstrakcyjnych
```

---

## 28. Lambdy a typy docelowe (target types)

### Pytanie 128 — inferencja typów lambda

```java
// Java inferuje typ lambdy z kontekstu (target type):

// 1. Deklaracja zmiennej:
Runnable r = () -> System.out.println("Hello"); // target type = Runnable

// 2. Argument metody:
void execute(Runnable r) { r.run(); }
execute(() -> System.out.println("Hello")); // target type = Runnable

// 3. Zwracana wartość:
Runnable create() { return () -> System.out.println("Hello"); } // target type = Runnable

// 4. Rzutowanie (casting):
Object obj = (Runnable) () -> System.out.println("Hello"); // target type = Runnable

// Problem z niejednoznacznym kontekstem:
void overloaded(Runnable r) { r.run(); }
void overloaded(Callable<Integer> c) throws Exception { c.call(); }

// ❌ BŁĄD — kompilator nie wie który overload:
// overloaded(() -> System.out.println("Hello")); // niejednoznaczne!

// ✅ Jawne rzutowanie:
overloaded((Runnable) () -> System.out.println("Hello"));
overloaded((Callable<Integer>) () -> { System.out.println("Hello"); return 0; });
```

---

## 29. Interfejsy funkcyjne — Function.identity()

### Pytanie 129 — Function.identity() i zastosowania

```java
// Function.identity() zwraca funkcję, która zwraca swój argument bez zmian
Function<String, String> identity = Function.identity();
identity.apply("hello"); // "hello"

// Zastosowanie w Collectors.toMap():
List<String> words = List.of("apple", "banana", "cherry");

// Mapa słowo -> słowo (identity jako value mapper):
Map<String, String> wordMap = words.stream()
    .collect(Collectors.toMap(Function.identity(), Function.identity()));
// {apple=apple, banana=banana, cherry=cherry}

// Mapa słowo -> długość:
Map<String, Integer> lengthMap = words.stream()
    .collect(Collectors.toMap(Function.identity(), String::length));
// {apple=5, banana=6, cherry=6}

// W reduce():
List<Function<Integer, Integer>> transforms = List.of(
    x -> x + 1,
    x -> x * 2
);
Function<Integer, Integer> composed = transforms.stream()
    .reduce(Function.identity(), Function::andThen);
composed.apply(5); // (5+1)*2 = 12
```

---

## 30. Interfejsy funkcyjne — podsumowanie egzaminacyjne

### Pytanie 130–140 — kluczowe fakty do zapamiętania

```java
// Podsumowanie wszystkich standardowych interfejsów funkcyjnych:

// java.lang (od zawsze):
// Runnable: () -> void
// Comparable<T>: compareTo(T o) -> int

// java.util.function (Java 8+):
// Function<T,R>: apply(T) -> R | andThen, compose, identity
// Predicate<T>: test(T) -> boolean | and, or, negate, not, isEqual
// Consumer<T>: accept(T) -> void | andThen
// Supplier<T>: get() -> T
// BiFunction<T,U,R>: apply(T,U) -> R | andThen
// BiPredicate<T,U>: test(T,U) -> boolean | and, or, negate
// BiConsumer<T,U>: accept(T,U) -> void | andThen
// UnaryOperator<T> extends Function<T,T>: apply(T) -> T | identity
// BinaryOperator<T> extends BiFunction<T,T,T>: apply(T,T) -> T | maxBy, minBy

// Prymitywne (przykłady):
// IntFunction<R>: apply(int) -> R
// ToIntFunction<T>: applyAsInt(T) -> int
// IntUnaryOperator: applyAsInt(int) -> int
// IntBinaryOperator: applyAsInt(int,int) -> int
// IntPredicate: test(int) -> boolean
// IntConsumer: accept(int) -> void
// IntSupplier: getAsInt() -> int
// (analogicznie Long*, Double*)

// Specjalne Operator odwołania:
// ObjIntConsumer<T>: accept(T, int) -> void
// ToIntBiFunction<T,U>: applyAsInt(T,U) -> int
```

**Zasady egzaminacyjne:**

1. **Lambdy są effectively final** — przechwycone zmienne lokalne nie mogą być modyfikowane.
2. **`this` w lambdzie** = otaczająca klasa (nie lambda). W klasie anonimowej = sama klasa anonimowa.
3. **Method reference** `ClassName::instanceMethod` — pierwszy argument staje się `this`.
4. **Konflikt overload** z lambdami — użyj jawnego rzutowania.
5. **`andThen` vs `compose`**: `f.andThen(g)(x)` = `g(f(x))`, `f.compose(g)(x)` = `f(g(x))`.
6. **Predicate.and/or** — short-circuit (leniwe): `and` zatrzymuje się przy `false`, `or` przy `true`.
7. **@FunctionalInterface** — opcjonalna adnotacja, ale wymusza weryfikację przez kompilator.
8. **Checked exceptions** w lambdach — muszą być obsłużone (try-catch) lub użyj własnego interfejsu.
