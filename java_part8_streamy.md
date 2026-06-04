# Przewodnik egzaminacyjny Java — Część 8: Stream API
## (pytania 220–259)

---

## 1. Podstawy Stream API — pipeline

### Pytanie 220 — architektura Stream API

`Stream API` (Java 8) to narzędzie do przetwarzania sekwencji elementów w stylu funkcyjnym. Kluczowa architektura: **pipeline** (potok przetwarzania).

```
Źródło (Source) → Operacje pośrednie (Intermediate) → Operacja końcowa (Terminal)
```

```java
// Pełny przykład pipeline'u:
List<String> names = List.of("Alice", "Bob", "Anna", "Charlie", "David", "Alicia");

long count = names.stream()           // 1. Źródło — Stream<String>
    .filter(s -> s.startsWith("A"))   // 2. Intermediate — filtruj
    .map(String::toLowerCase)         // 3. Intermediate — transformuj
    .sorted()                         // 4. Intermediate — posortuj
    .distinct()                       // 5. Intermediate — unikalne
    .peek(s -> System.out.println("Processing: " + s)) // 6. debug
    .count();                         // 7. Terminal — zlicz → long

// KLUCZOWE właściwości pipeline'u:
// 1. LENIWE obliczenia (lazy) — operacje intermediate NIE są wykonywane do momentu
//    wywołania operacji terminal!
// 2. Stream może być skonsumowany TYLKO RAZ — po wykonaniu operacji terminal jest "zamknięty"
// 3. Oryginalne dane NIE są modyfikowane — Stream tworzy nowy widok
```

---

## 2. Źródła Streamów

### Pytanie 221 — skąd biorą się Streamy?

```java
// 1. Z kolekcji:
List<String> list = List.of("a", "b", "c");
Stream<String> fromList = list.stream();
Stream<String> parallel = list.parallelStream(); // wersja równoległa

// 2. Z tablicy:
String[] array = {"x", "y", "z"};
Stream<String> fromArray = Arrays.stream(array);
Stream<String> fromArrayRange = Arrays.stream(array, 1, 3); // [1,3) → "y", "z"

// 3. Stream.of():
Stream<String> explicit = Stream.of("a", "b", "c");
Stream<String> singleElem = Stream.of("only");
Stream<Object> empty = Stream.empty(); // pusty stream

// 4. Stream.generate() — nieskończony (lazy):
Stream<Double> randoms = Stream.generate(Math::random); // nieskończony!
Stream<Integer> zeros = Stream.generate(() -> 0);
Stream<String> uuids = Stream.generate(() -> java.util.UUID.randomUUID().toString());
// ZAWSZE musisz ograniczyć: .limit(n)
List<Double> fiveRandoms = Stream.generate(Math::random).limit(5).collect(java.util.stream.Collectors.toList());

// 5. Stream.iterate() — nieskończony sekwencyjny:
// Stara wersja (Java 8+):
Stream<Integer> evens = Stream.iterate(0, n -> n + 2); // 0, 2, 4, 6, ...
// Nowa wersja z predykatem (Java 9+):
Stream<Integer> under100 = Stream.iterate(0, n -> n < 100, n -> n + 2); // 0,2,4,...,98

// 6. IntStream/LongStream ranges:
IntStream range = IntStream.range(0, 10);         // 0..9 (exclusive end)
IntStream rangeClosed = IntStream.rangeClosed(1, 10); // 1..10 (inclusive end)
LongStream longs = LongStream.range(0L, 1_000_000L);

// 7. Inne metody:
Stream<String> lines = Files.lines(Path.of("file.txt")); // linie pliku (lazy!)
Stream<Path> paths = Files.walk(Path.of("."));            // drzewo katalogów
Random random = new Random(42);
IntStream randomInts = random.ints(100, 0, 100);           // 100 liczb w [0,100)
```

---

## 3. Operacje intermediate — lazy

### Pytanie 222 — filter, map, flatMap, distinct, sorted, peek, limit, skip

```java
List<String> words = List.of("hello", "world", "java", "stream", "api", "hello");

// filter(Predicate) — zachowaj elementy spełniające warunek:
Stream<String> longWords = words.stream()
    .filter(s -> s.length() > 4); // "hello", "world", "stream"

// map(Function) — transformuj każdy element:
Stream<Integer> lengths = words.stream()
    .map(String::length); // 5, 5, 4, 6, 3, 5

// distinct() — usuń duplikaty (używa equals/hashCode):
Stream<String> unique = words.stream()
    .distinct(); // "hello", "world", "java", "stream", "api"

// sorted() — posortuj (natural ordering lub Comparator):
Stream<String> sorted = words.stream()
    .sorted(); // "api", "hello", "hello", "java", "stream", "world"
Stream<String> sortedByLength = words.stream()
    .sorted(Comparator.comparingInt(String::length));

// limit(n) — weź pierwsze n elementów (short-circuit!):
Stream<String> first3 = words.stream()
    .limit(3); // "hello", "world", "java"

// skip(n) — pomiń pierwsze n elementów:
Stream<String> skip2 = words.stream()
    .skip(2); // "java", "stream", "api", "hello"

// peek(Consumer) — efekt uboczny (DO DEBUGOWANIA TYLKO):
Stream<String> debugged = words.stream()
    .peek(s -> System.out.println("Before filter: " + s))
    .filter(s -> s.length() > 4)
    .peek(s -> System.out.println("After filter: " + s));
// UWAGA: peek jest intermediate — nic nie wykona się bez operacji terminal!
```

---

## 4. flatMap — kluczowa operacja

### Pytanie 223 — flatMap vs map

**`flatMap`** to jedna z ważniejszych operacji — spłaszcza stream streamów:

```java
// map() → Stream<Stream<T>>:
List<String> sentences = List.of("Hello World", "Java Stream API");
Stream<String[]> mapped = sentences.stream()
    .map(s -> s.split(" ")); // Stream<String[]>

// flatMap() → Stream<T> — spłaszcza jeden poziom:
Stream<String> flattened = sentences.stream()
    .flatMap(s -> Arrays.stream(s.split(" "))); // Stream<String>
// "Hello", "World", "Java", "Stream", "API"

// Konkretny przykład — zliczanie unikalnych słów ze wszystkich zdań:
List<String> docs = List.of("the quick brown fox", "the lazy dog", "quick brown fox jumps");
long uniqueWords = docs.stream()
    .flatMap(doc -> Arrays.stream(doc.split("\\s+")))
    .distinct()
    .count(); // 7 unikalnych słów

// flatMap z kolekcjami zagnieżdżonymi:
record Order(String id, List<String> items) {}
List<Order> orders = List.of(
    new Order("1", List.of("Apple", "Banana")),
    new Order("2", List.of("Cherry", "Apple", "Date")),
    new Order("3", List.of("Banana", "Elderberry"))
);

List<String> allItems = orders.stream()
    .flatMap(order -> order.items().stream())
    .collect(java.util.stream.Collectors.toList());
// [Apple, Banana, Cherry, Apple, Date, Banana, Elderberry]

List<String> uniqueItems = orders.stream()
    .flatMap(order -> order.items().stream())
    .distinct()
    .sorted()
    .collect(java.util.stream.Collectors.toList());
// [Apple, Banana, Cherry, Date, Elderberry]

// flatMapToInt/Long/Double — dla primitive streams:
List<int[]> arrays = List.of(new int[]{1,2,3}, new int[]{4,5,6});
IntStream allInts = arrays.stream()
    .flatMapToInt(Arrays::stream); // 1, 2, 3, 4, 5, 6
```

---

## 5. Operacje terminal

### Pytanie 224 — operacje kończące pipeline

```java
List<Integer> numbers = List.of(5, 2, 8, 1, 9, 3, 7, 4, 6);

// count() — liczba elementów:
long count = numbers.stream().filter(n -> n > 5).count(); // 4

// sum(), min(), max() — dla primitive streams:
OptionalInt minInt = numbers.stream().mapToInt(Integer::intValue).min(); // OptionalInt[1]
OptionalInt maxInt = numbers.stream().mapToInt(Integer::intValue).max(); // OptionalInt[9]
int sum = numbers.stream().mapToInt(Integer::intValue).sum();            // 45
double avg = numbers.stream().mapToInt(Integer::intValue).average().orElse(0); // 5.0

// min/max dla Stream<T> (wymaga Comparator):
Optional<Integer> min = numbers.stream().min(Integer::compare);  // Optional[1]
Optional<Integer> max = numbers.stream().max(Integer::compare);  // Optional[9]

// findFirst() — pierwszy element (short-circuit):
Optional<Integer> first = numbers.stream()
    .filter(n -> n > 5)
    .findFirst(); // Optional[8] — zawsze ten sam, deterministyczny

// findAny() — dowolny element (szybszy przy parallel streams):
Optional<Integer> any = numbers.stream()
    .filter(n -> n > 5)
    .findAny(); // Optional[8] lub inny — niedeterministyczny przy parallel

// anyMatch/allMatch/noneMatch (short-circuit):
boolean anyAbove8 = numbers.stream().anyMatch(n -> n > 8);   // true (9 > 8)
boolean allPositive = numbers.stream().allMatch(n -> n > 0); // true
boolean noneNegative = numbers.stream().noneMatch(n -> n < 0); // true

// forEach — efekt uboczny dla każdego elementu:
numbers.stream().forEach(n -> System.out.print(n + " "));
numbers.forEach(n -> System.out.print(n + " ")); // lepiej! Bezpośrednio na Iterable

// toArray():
Integer[] arr = numbers.stream().toArray(Integer[]::new);
Object[] objArr = numbers.stream().toArray(); // tablica Object[]
```

---

## 6. collect() i Collectors

### Pytanie 225 — Collectors — zbieranie wyników

```java
import java.util.stream.Collectors;

List<String> names = List.of("Alice", "Bob", "Anna", "Charlie", "Dave", "Alicia");

// Podstawowe zbieranie:
List<String> nameList = names.stream().collect(Collectors.toList());
Set<String> nameSet = names.stream().collect(Collectors.toSet());
// Java 16+:
List<String> unmodList = names.stream().collect(Collectors.toUnmodifiableList());

// toMap — konwersja do Map:
Map<String, Integer> nameToLength = names.stream()
    .collect(Collectors.toMap(
        n -> n,             // keyMapper
        String::length      // valueMapper
    ));
// Problem: duplikaty kluczy rzucają IllegalStateException!
// Rozwiązanie — mergeFunction:
Map<String, Integer> withMerge = names.stream()
    .collect(Collectors.toMap(
        n -> n.substring(0, 1), // klucz = pierwsza litera (duplikaty!)
        String::length,          // wartość = długość
        (v1, v2) -> v1 + v2     // merge: dodaj przy konflikcie
    ));
// A → Alice(5) + Anna(4) + Alicia(6) = 15

// groupingBy — grupowanie:
Map<Integer, List<String>> byLength = names.stream()
    .collect(Collectors.groupingBy(String::length));
// {3=[Bob], 4=[Anna, Dave], 5=[Alice], 7=[Charlie], 6=[Alicia]}

// groupingBy z downstream collector:
Map<Integer, Long> countByLength = names.stream()
    .collect(Collectors.groupingBy(String::length, Collectors.counting()));
// {3=1, 4=2, 5=1, 7=1, 6=1}

Map<Integer, List<String>> upperByLength = names.stream()
    .collect(Collectors.groupingBy(
        String::length,
        Collectors.mapping(String::toUpperCase, Collectors.toList())
    ));

// partitioningBy — podział na true/false:
Map<Boolean, List<String>> partition = names.stream()
    .collect(Collectors.partitioningBy(s -> s.startsWith("A")));
// {true=[Alice, Anna, Alicia], false=[Bob, Charlie, Dave]}

// joining — łączenie ciągów:
String joined = names.stream().collect(Collectors.joining());           // "AliceBobAnna..."
String withDelim = names.stream().collect(Collectors.joining(", "));    // "Alice, Bob, ..."
String full = names.stream().collect(Collectors.joining(", ", "[", "]")); // "[Alice, Bob, ...]"

// counting():
Long total = names.stream().collect(Collectors.counting()); // 6

// summingInt/Long/Double:
Integer totalLength = names.stream().collect(Collectors.summingInt(String::length)); // 30

// averagingInt/Long/Double:
Double avgLength = names.stream().collect(Collectors.averagingInt(String::length)); // 5.0

// summarizingInt — wszystkie statystyki naraz:
java.util.IntSummaryStatistics stats = names.stream()
    .collect(Collectors.summarizingInt(String::length));
System.out.println(stats.getMin());   // 3
System.out.println(stats.getMax());   // 7
System.out.println(stats.getSum());   // 30
System.out.println(stats.getAverage()); // 5.0
System.out.println(stats.getCount()); // 6
```

---

## 7. Optional — obsługa wartości opcjonalnych

### Pytanie 226 — Optional — API i przypadki użycia

```java
import java.util.Optional;

// Tworzenie Optional:
Optional<String> present = Optional.of("Hello");       // nie-null wartość
Optional<String> empty = Optional.empty();              // pusta Optional
Optional<String> nullable = Optional.ofNullable(null); // może być null → empty

// Optional.of() z null → NullPointerException!
// Optional.ofNullable() z null → Optional.empty()

// Sprawdzanie:
present.isPresent();  // true
empty.isPresent();    // false
present.isEmpty();    // false (Java 11+)
empty.isEmpty();      // true  (Java 11+)

// Pobieranie wartości:
String value = present.get();          // "Hello" (NullPointerException jeśli empty!)
String orElse = empty.orElse("default"); // "default" (wartość domyślna)
// RÓŻNICA orElse vs orElseGet:
String eager = empty.orElse(createDefault()); // createDefault() ZAWSZE wywoływana
String lazy = empty.orElseGet(() -> createDefault()); // ✅ LAZY — tylko gdy empty

// orElseThrow:
String orThrow = present.orElseThrow();                          // "Hello" lub NoSuchElement
String withMsg = empty.orElseThrow(() -> new IllegalStateException("Empty!")); // rzuca

// Transformacje:
Optional<Integer> length = present.map(String::length);          // Optional[5]
Optional<String> upper = present.map(String::toUpperCase);       // Optional["HELLO"]
Optional<String> emptyMapped = empty.map(String::toUpperCase);   // Optional.empty

// flatMap — gdy mapper zwraca Optional:
Optional<String> name = Optional.of("  Alice  ");
Optional<String> trimmed = name.map(String::trim);               // "Alice"
// Bez flatMap (gdy mapper zwraca Optional):
Optional<Optional<String>> nested = name.map(s -> Optional.of(s.trim())); // Optional[Optional["Alice"]]
Optional<String> flat = name.flatMap(s -> Optional.of(s.trim()));  // Optional["Alice"]

// filter:
Optional<String> filtered = present.filter(s -> s.length() > 3); // Optional["Hello"]
Optional<String> filteredOut = present.filter(s -> s.length() > 10); // Optional.empty

// ifPresent — efekt uboczny tylko gdy wartość jest:
present.ifPresent(System.out::println); // drukuje "Hello"
empty.ifPresent(System.out::println);   // nic nie robi

// ifPresentOrElse (Java 9+):
present.ifPresentOrElse(
    s -> System.out.println("Present: " + s),
    () -> System.out.println("Empty")
); // "Present: Hello"

// or() (Java 9+) — alternatywna Optional:
Optional<String> result = empty.or(() -> Optional.of("fallback")); // Optional["fallback"]

// stream() (Java 9+) — konwersja Optional → Stream:
Optional.of("hello").stream().forEach(System.out::println); // "hello"
Optional.<String>empty().stream().forEach(System.out::println); // nic

// Praktyczny wzorzec — łańcuch Optional:
Optional<String> processedName = Optional.ofNullable(getUserName())
    .filter(s -> !s.isBlank())
    .map(String::trim)
    .map(String::toUpperCase);
```

---

## 8. reduce() — agregacja

### Pytanie 227 — reduce() — składanie do jednej wartości

```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5);

// reduce(identity, BinaryOperator) — z wartością tożsamości:
int sum = numbers.stream().reduce(0, Integer::sum);   // 0+1+2+3+4+5 = 15
int product = numbers.stream().reduce(1, (a, b) -> a * b); // 1*1*2*3*4*5 = 120
String concat = Stream.of("a","b","c").reduce("", String::concat); // "abc"

// reduce(BinaryOperator) — bez identity, zwraca Optional:
Optional<Integer> max = numbers.stream().reduce(Integer::max); // Optional[5]
Optional<Integer> min = numbers.stream().reduce(Integer::min); // Optional[1]
Optional<Integer> emptyReduce = Stream.<Integer>empty().reduce(Integer::sum); // Optional.empty

// WAŻNE — identity musi być prawdziwą wartością tożsamości:
// identity e spełnia: f(e, x) = x dla każdego x
// Dla sumy: 0 (bo 0+x = x) ✅
// Dla mnożenia: 1 (bo 1*x = x) ✅
// Dla String concat: "" (bo ""+s = s) ✅

// reduce(identity, accumulator, combiner) — dla parallel streams:
// combiner łączy wyniki z różnych wątków
int parallelSum = numbers.parallelStream()
    .reduce(0, Integer::sum, Integer::sum); // trzeci arg = combiner

// Przykład — sumowanie długości:
int totalLength = Stream.of("Hello", "World", "Java")
    .reduce(0,
        (acc, s) -> acc + s.length(), // accumulator: int + String → int
        Integer::sum                   // combiner (dla parallel)
    ); // 5 + 5 + 4 = 14

// ZASADA: reduce jest ASOCJATYWNA — wynik nie powinien zależeć od kolejności
// Dla parallel stream: (a ⊕ b) ⊕ c == a ⊕ (b ⊕ c) musi być prawdą
```

---

## 9. Collectors — zaawansowane

### Pytanie 228 — zagnieżdżone i niestandardowe Collectors

```java
// Zagnieżdżony groupingBy:
record Student(String name, String subject, int grade) {}
List<Student> students = List.of(
    new Student("Alice", "Math", 90),
    new Student("Bob", "Math", 85),
    new Student("Alice", "Science", 92),
    new Student("Bob", "Science", 78),
    new Student("Charlie", "Math", 88)
);

// Grupowanie po przedmiocie, potem po nazwie:
Map<String, Map<String, Integer>> gradesBySubjectAndName = students.stream()
    .collect(Collectors.groupingBy(
        Student::subject,
        Collectors.toMap(Student::name, Student::grade, Integer::sum)
    ));
// {Math={Alice=90, Bob=85, Charlie=88}, Science={Alice=92, Bob=78}}

// Collector.teeing() (Java 12+) — zbieranie dwoma Collectorami jednocześnie:
List<Integer> nums = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
var stats = nums.stream()
    .collect(Collectors.teeing(
        Collectors.summingInt(Integer::intValue),   // sum
        Collectors.counting(),                       // count
        (sum, count) -> Map.of("sum", sum, "count", count)
    ));
// {sum=55, count=10}

// Collectors.toUnmodifiableMap/List/Set (Java 10+):
Map<String, Integer> unmodMap = students.stream()
    .collect(Collectors.toUnmodifiableMap(
        Student::name,
        Student::grade,
        Integer::max // merge dla duplikatów
    ));

// Collectors.filtering (Java 9+):
Map<String, List<Student>> filteredBySubject = students.stream()
    .collect(Collectors.groupingBy(
        Student::subject,
        Collectors.filtering(s -> s.grade() >= 88, Collectors.toList())
    ));

// Własny Collector:
Collector<String, StringBuilder, String> joining = Collector.of(
    StringBuilder::new,                    // supplier
    StringBuilder::append,                 // accumulator
    StringBuilder::append,                 // combiner (dla parallel)
    StringBuilder::toString                // finisher
);
String result = Stream.of("a", "b", "c").collect(joining); // "abc"
```

---

## 10. Stream vs Collection — różnice

### Pytanie 229 — kiedy Stream, kiedy Collection?

```java
// STREAM:
// - Jednokrotne użycie (nie możesz iterować dwa razy bez nowego stream())
// - Lazy evaluation — operacje nie wykonują się do terminal
// - Może być nieskończony (Stream.generate, Stream.iterate)
// - Funkcyjny styl, brak stanu (ideally)
// - Może być parallel (parallelStream())
// - Nie przechowuje danych — przetwarza je

// COLLECTION:
// - Przechowuje dane w pamięci
// - Wielokrotna iteracja
// - Modyfikowalna (ArrayList, HashMap)
// - Zawsze skończona
// - Sekwencyjna iteracja (chyba że spliterator + parallel)

// Przykład ponownego użycia — BŁĄD:
Stream<String> stream = List.of("a", "b", "c").stream();
long count1 = stream.count();         // 3 — OK
// long count2 = stream.count();      // ❌ IllegalStateException — stream już użyty!

// Rozwiązanie: utwórz nowy stream za każdym razem lub użyj Collection:
List<String> list = List.of("a", "b", "c");
long count1b = list.stream().count();  // ✅ zawsze nowy stream
long count2b = list.stream().count();  // ✅ kolejny nowy stream

// Kiedy Stream jest lepszy:
// - Transformacje danych (map, flatMap, filter)
// - Agregacje (sum, count, groupBy)
// - Lazy processing dużych zbiorów danych
// - Parallel processing

// Kiedy Collection jest lepsza:
// - Wielokrotny dostęp do danych
// - Losowy dostęp przez indeks
// - Modyfikowanie danych (add, remove, set)
// - Przekazywanie danych między metodami
```

---

## 11. Parallel Streams

### Pytanie 230 — strumienie równoległe

```java
// Tworzenie parallel stream:
List<Integer> bigList = java.util.stream.IntStream.rangeClosed(1, 1_000_000)
    .boxed()
    .collect(java.util.stream.Collectors.toList());

// Opcja 1 — parallelStream():
long sum1 = bigList.parallelStream()
    .mapToLong(Integer::longValue)
    .sum(); // używa ForkJoinPool.commonPool()

// Opcja 2 — .parallel() na istniejącym stream:
long sum2 = bigList.stream()
    .parallel()
    .mapToLong(Integer::longValue)
    .sum();

// .sequential() — powrót do sekwencyjnego:
long seq = bigList.stream()
    .parallel()
    .filter(n -> n % 2 == 0)
    .sequential() // wróć do sekwencyjnego od tego momentu
    .mapToLong(Long::valueOf)
    .sum();

// KIEDY parallel jest korzystny:
// ✅ Duże zbiory danych (> 10_000 elementów zazwyczaj)
// ✅ Kosztowne operacje per element (CPU-intensive)
// ✅ Operacje bezstanowe (stateless)
// ✅ Asocjatywne operacje (kolejność nie ma znaczenia dla wyniku)

// KIEDY parallel SZKODZI:
// ❌ Mały zbiór danych (overhead wątków > zysk)
// ❌ Operacje I/O bound (wątki czekają na I/O — nie CPU)
// ❌ Operacje z efektami ubocznymi (modyfikacja wspólnego stanu!)
// ❌ Gdy kolejność elementów ważna (findFirst, limit - może być nieprzewidywalne)

// PUŁAPKA — efekty uboczne w parallel:
List<Integer> result = new ArrayList<>();
IntStream.range(0, 1000)
    .parallel()
    .forEach(i -> result.add(i)); // ❌ RACE CONDITION! ArrayList nie jest thread-safe
// Poprawnie:
List<Integer> safeResult = IntStream.range(0, 1000)
    .parallel()
    .boxed()
    .collect(java.util.stream.Collectors.toList()); // ✅ Collectors są thread-safe

// Spliterator — mechanizm podziału dla parallel:
// Spliterator dzieli dane na mniejsze części dla wątków
// Większość kolekcji Java ma wydajny spliterator
```

---

## 12. IntStream, LongStream, DoubleStream

### Pytanie 231 — primitive streams

```java
// Primitive streams unikają autoboxingu — wydajniejsze dla prymitywów!

// IntStream:
IntStream intStream = IntStream.of(1, 2, 3, 4, 5);
IntStream range = IntStream.range(1, 6);       // 1,2,3,4,5 (exclusive end)
IntStream closed = IntStream.rangeClosed(1, 5); // 1,2,3,4,5 (inclusive end)
IntStream randomInts = new java.util.Random().ints(10, 0, 100);

// Operacje na primitive streams:
int sum = intStream.sum();                  // 15
OptionalInt min = intStream.min();          // ale stream już zużyty! — nowy:
OptionalInt max = IntStream.of(1,2,3).max();
OptionalDouble avg = IntStream.of(1,2,3).average();
IntSummaryStatistics stats = IntStream.rangeClosed(1,10).summaryStatistics();

// Konwersja Stream<T> ↔ IntStream/LongStream/DoubleStream:
List<String> words = List.of("hello", "world", "java");

// Stream<T> → IntStream:
IntStream lengths = words.stream().mapToInt(String::length); // 5, 5, 4
// Stream<T> → LongStream:
LongStream longLengths = words.stream().mapToLong(String::length);
// Stream<T> → DoubleStream:
DoubleStream doubleVals = words.stream().mapToDouble(String::length);

// IntStream → Stream<T>:
Stream<Integer> boxed = IntStream.range(1, 5).boxed();   // autobox → Stream<Integer>
Stream<String> mapped = IntStream.range(1, 5).mapToObj(i -> "item_" + i); // "item_1"...

// Przydatne metody:
int sumOfSquares = IntStream.rangeClosed(1, 10)
    .map(n -> n * n)
    .sum(); // 1+4+9+...+100 = 385

// chars() — String → IntStream (kod Unicode):
"Hello".chars()                         // IntStream z Unicode code points
    .filter(c -> c != 'l')              // filtruj 'l'
    .forEach(c -> System.out.print((char) c)); // Heo
```

---

## 13. Lazy Evaluation — jak działa leniwe obliczanie

### Pytanie 232 — lazy evaluation w praktyce

```java
// Operacje intermediate są LAZY — nie wykonują się do terminal!
Stream<Integer> stream = Stream.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    .filter(n -> {
        System.out.println("Filtering: " + n);
        return n % 2 == 0;
    })
    .map(n -> {
        System.out.println("Mapping: " + n);
        return n * n;
    });
// Jeszcze nic nie zostało wypisane!

Optional<Integer> first = stream.findFirst(); // TERAZ zaczyna się przetwarzanie!
// Wypisuje:
// Filtering: 1 (nie przechodzi filter)
// Filtering: 2 (przechodzi filter)
// Mapping: 2 (mapowanie 2 → 4)
// STOP! findFirst() znalazł wynik — reszta nie jest przetwarzana!

// Short-circuit operations — zatrzymują przetwarzanie wcześniej:
// findFirst(), findAny(), anyMatch(), allMatch(), noneMatch(), limit()

// Przykład efektu lazy + short-circuit:
long count = Stream.iterate(0, n -> n + 1) // nieskończony stream 0,1,2,3,...
    .filter(n -> n % 2 == 0)              // parzyste
    .limit(5)                              // zatrzymaj po 5
    .count(); // 5 — i zatrzymuje nieskończony stream!

// Bez limit() byłoby nieskończone przetwarzanie!

// Kolejność operacji ma znaczenie dla wydajności:
List<String> names = List.of("Alice", "Bob", "Anna", "Charlie", "Adam", "David");

// ❌ NIEOPTYMALNE — filter po sortowaniu (sortuje wszystkich):
names.stream()
    .sorted()
    .filter(s -> s.startsWith("A"))
    .forEach(System.out::println);

// ✅ OPTYMALNE — filter przed sortowaniem (sortuje tylko pasujących):
names.stream()
    .filter(s -> s.startsWith("A"))
    .sorted()
    .forEach(System.out::println);
```

---

## 14. Short-circuit Operations

### Pytanie 233 — operacje przerywające strumień

```java
// OPERACJE SHORT-CIRCUIT mogą zakończyć przetwarzanie wcześniej niż koniec strumienia

// findFirst() — zwraca pierwszy pasujący element, natychmiast kończy:
Optional<Integer> firstEven = IntStream.rangeClosed(1, 1_000_000)
    .filter(n -> n % 2 == 0)
    .boxed()
    .findFirst(); // Optional[2] — sprawdza tylko: 1 (nie), 2 (tak!) → koniec

// findAny() — dowolny pasujący (przydatny dla parallel):
Optional<Integer> anyEven = IntStream.rangeClosed(1, 1_000_000)
    .parallel()
    .filter(n -> n % 2 == 0)
    .boxed()
    .findAny(); // może być 2, ale może być cokolwiek innego

// anyMatch — szybkie sprawdzenie czy cokolwiek pasuje:
boolean hasEven = IntStream.rangeClosed(1, 1_000_000)
    .anyMatch(n -> n % 2 == 0); // true — kończy po znalezieniu 2

// allMatch — sprawdza wszystkie (kończy przy pierwszym false):
boolean allPositive = IntStream.rangeClosed(1, 1_000_000)
    .allMatch(n -> n > 0); // true — musi sprawdzić wszystkie...
boolean allSmall = IntStream.rangeClosed(1, 1_000_000)
    .allMatch(n -> n < 100); // false — kończy po znalezieniu 100

// noneMatch — kończy przy pierwszym true:
boolean noneNegative = IntStream.rangeClosed(1, 1_000_000)
    .noneMatch(n -> n < 0); // true — musi sprawdzić wszystkie...
boolean noneAbove999 = IntStream.rangeClosed(1, 1_000_000)
    .noneMatch(n -> n > 999); // false — kończy po znalezieniu 1000

// limit() — intermediate short-circuit:
IntStream.iterate(0, n -> n + 1)  // nieskończony!
    .filter(n -> n % 3 == 0)
    .limit(5)                      // koniec po 5 elementach
    .forEach(System.out::println); // 0, 3, 6, 9, 12
```

---

## 15. Stateful vs Stateless Intermediate Operations

### Pytanie 234 — operacje stanowe i bezstanowe

```java
// STATELESS (bezstanowe) — każdy element przetwarzany niezależnie:
// filter(), map(), flatMap(), peek(), mapToInt(), mapToLong(), mapToDouble()
// Mogą być efektywnie przetworzone równolegle
// Nie potrzebują widzieć innych elementów

// STATEFUL (stanowe) — muszą widzieć wiele/wszystkie elementy:
// distinct() — musi pamiętać widziane elementy
// sorted() — musi zebrać wszystkie elementy przed posortowaniem
// limit() — musi liczyć elementy (ale short-circuit)
// skip() — musi liczyć elementy (ale bezpiecznie z parallel)

// Dlaczego to ważne dla parallel streams?
List<Integer> numbers = List.of(5, 3, 1, 4, 2);

// sorted() wymaga zebrania wszystkich elementów — bariera synchronizacji:
numbers.parallelStream()
    .filter(n -> n > 0)        // stateless — parallel-friendly
    .sorted()                   // STATEFUL — musi zebrać wszystkie przed posortowaniem
    .limit(3)                   // stateful ale short-circuit
    .forEach(System.out::println); // 1, 2, 3

// Najlepiej: stateless operacje przed stateful:
numbers.parallelStream()
    .filter(n -> n > 2)   // stateless — parallel przetwarzanie
    .map(n -> n * 2)      // stateless — parallel przetwarzanie
    .sorted()             // stateful — bariera; tu parallel jest łączony
    .collect(java.util.stream.Collectors.toList());
```

---

## 16. Stream.generate() i Stream.iterate() — szczegóły

### Pytanie 235 — nieskończone strumienie

```java
// Stream.generate() — każdy element generowany niezależnie (bezstanowe):
Stream.generate(() -> "hello")     // nieskończone "hello", "hello", ...
    .limit(5)
    .forEach(System.out::println); // hello x5

// Stream.generate() z Supplier z stanem (antipattern dla parallel!):
int[] counter = {0}; // HACK — effectively final array
Stream.generate(() -> ++counter[0])
    .limit(5)
    .forEach(System.out::println); // 1,2,3,4,5 sekwencyjnie (ale brak gwarancji!)

// Stream.iterate() — sekwencyjne, każdy element zależy od poprzedniego:
// Java 8 — bez predykatu (nieskończone):
Stream.iterate(1, n -> n * 2)      // 1, 2, 4, 8, 16, ...
    .limit(10)
    .forEach(System.out::println);

// Java 9+ — z predykatem (skończone):
Stream.iterate(1, n -> n <= 1000, n -> n * 2) // dopóki n <= 1000, podwajaj
    .forEach(System.out::println); // 1, 2, 4, 8, 16, ..., 512

// Fibonacci z Stream.iterate():
Stream.iterate(
    new long[]{0, 1},           // stan: [a, b]
    arr -> new long[]{arr[1], arr[0] + arr[1]} // [b, a+b]
)
.limit(10)
.map(arr -> arr[0])            // weź pierwszy element
.forEach(System.out::println); // 0,1,1,2,3,5,8,13,21,34
```

---

## 17. Collectors.groupingBy — zaawansowane

### Pytanie 236 — wielopoziomowe grupowanie

```java
record Employee(String name, String dept, int salary) {}
List<Employee> employees = List.of(
    new Employee("Alice", "IT", 90000),
    new Employee("Bob", "HR", 60000),
    new Employee("Charlie", "IT", 85000),
    new Employee("Diana", "HR", 65000),
    new Employee("Eve", "IT", 95000)
);

// Grupowanie z liczeniem:
Map<String, Long> countByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept, Collectors.counting()));
// {IT=3, HR=2}

// Grupowanie z sumowaniem:
Map<String, Integer> totalSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::dept,
        Collectors.summingInt(Employee::salary)
    ));
// {IT=270000, HR=125000}

// Grupowanie z wartością max:
Map<String, Optional<Employee>> highestPaidByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::dept,
        Collectors.maxBy(Comparator.comparingInt(Employee::salary))
    ));
// {IT=Optional[Eve(95000)], HR=Optional[Diana(65000)]}

// Grupowanie z joining:
Map<String, String> namesByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::dept,
        Collectors.mapping(Employee::name, Collectors.joining(", "))
    ));
// {IT=Alice, Charlie, Eve; HR=Bob, Diana}

// Dwupoziomowe grupowanie (by dept, then by salary range):
Map<String, Map<String, List<Employee>>> twoLevel = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::dept,
        Collectors.groupingBy(e -> e.salary() >= 85000 ? "high" : "low")
    ));
```

---

## 18. reduce() vs collect() — kiedy co?

### Pytanie 237 — reduce vs collect porównanie

```java
// reduce() — dla niemutowalnych akumulacji:
// ✅ Gdy wynik to pojedyncza wartość (int, String, Optional)
// ✅ Gdy operacja jest asocjatywna
// ✅ Bezpieczne dla parallel streams

// collect() — dla mutowalnych akumulacji:
// ✅ Gdy budujesz kolekcję (List, Map, Set)
// ✅ Wydajniejszy niż reduce() dla kolekcji
// ✅ Collectors są thread-safe w parallel

// ❌ ZŁE użycie reduce() do budowania listy:
List<String> badList = Stream.of("a", "b", "c")
    .reduce(new ArrayList<>(),
        (list, elem) -> { // PROBLEM: modify and return new list każdorazowo!
            ArrayList<String> copy = new ArrayList<>(list);
            copy.add(elem);
            return copy;
        },
        (l1, l2) -> { l1.addAll(l2); return l1; }
    ); // Działa, ale tworzy dużo kopii pośrednich — nieefektywne!

// ✅ DOBRE użycie collect() do budowania listy:
List<String> goodList = Stream.of("a", "b", "c")
    .collect(java.util.stream.Collectors.toList()); // O(n) bez kopii

// ✅ DOBRE użycie reduce() do sumowania:
int sum = Stream.of(1, 2, 3, 4, 5).reduce(0, Integer::sum); // 15
String concat = Stream.of("a","b","c").reduce("", String::concat); // "abc"
```

---

## 19. Stream API — operacje na mapach

### Pytanie 238 — Streams z Map

```java
Map<String, Integer> scores = Map.of(
    "Alice", 90, "Bob", 75, "Charlie", 88, "Diana", 92, "Eve", 65
);

// Strumień z Map:
scores.entrySet().stream()                     // Stream<Map.Entry<String,Integer>>
    .filter(e -> e.getValue() >= 80)           // filtruj wysokie wyniki
    .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder())) // sortuj malejąco
    .forEach(e -> System.out.println(e.getKey() + ": " + e.getValue()));
// Diana: 92, Alice: 90, Charlie: 88

// Strumień po kluczach:
List<String> topStudents = scores.keySet().stream()
    .filter(name -> scores.get(name) >= 85)
    .sorted()
    .collect(java.util.stream.Collectors.toList()); // [Alice, Charlie, Diana]

// Strumień po wartościach:
OptionalDouble avg = scores.values().stream()
    .mapToInt(Integer::intValue)
    .average(); // 82.0

// Transformacja Map przez Streams:
Map<String, String> gradeMap = scores.entrySet().stream()
    .collect(java.util.stream.Collectors.toMap(
        Map.Entry::getKey,
        e -> e.getValue() >= 90 ? "A" : e.getValue() >= 80 ? "B" : "C"
    ));
// {Alice=A, Bob=C, Charlie=B, Diana=A, Eve=C}
```

---

## 20. Collectors.toMap() — szczegóły i pułapki

### Pytanie 239 — toMap() z duplikatami

```java
// Problem: duplikaty kluczy rzucają IllegalStateException:
List<String> words = List.of("hello", "HELLO", "world");

// ❌ Błąd — zduplikowane klucze po toLowerCase():
// words.stream().collect(Collectors.toMap(
//     String::toLowerCase,  // "hello" i "HELLO" oba dają "hello"!
//     s -> s
// )); // IllegalStateException: Duplicate key hello

// ✅ Rozwiązanie — merge function:
Map<String, String> merged = words.stream()
    .collect(java.util.stream.Collectors.toMap(
        String::toLowerCase,  // key
        s -> s,               // value
        (existing, newVal) -> existing + ", " + newVal  // merge: "hello, HELLO"
    ));
// {hello=hello, HELLO, world=world}

// ✅ Zachowanie pierwszej wartości:
Map<String, String> keepFirst = words.stream()
    .collect(java.util.stream.Collectors.toMap(
        String::toLowerCase,
        s -> s,
        (a, b) -> a // zachowaj pierwszą
    ));

// ✅ Z LinkedHashMap (zachowanie kolejności):
Map<String, Integer> linkedMap = words.stream()
    .collect(java.util.stream.Collectors.toMap(
        s -> s,
        String::length,
        (a, b) -> a,
        java.util.LinkedHashMap::new // czwarty argument: Map factory
    ));
```

---

## 21. Stream API — przykłady egzaminacyjne

### Pytanie 240–259 — typowe zadania egzaminacyjne

```java
// ZADANIE 1: Znajdź 3 najdroższe produkty i wypisz ich nazwy:
record Product(String name, double price) {}
List<Product> products = List.of(
    new Product("Apple", 1.5), new Product("Laptop", 999.0),
    new Product("Book", 25.0), new Product("Phone", 599.0),
    new Product("Coffee", 5.0), new Product("Tablet", 349.0)
);

List<String> top3 = products.stream()
    .sorted(Comparator.comparingDouble(Product::price).reversed())
    .limit(3)
    .map(Product::name)
    .collect(java.util.stream.Collectors.toList());
// [Laptop, Phone, Tablet]

// ZADANIE 2: Czy wszystkie imiona zaczynają się wielką literą?
List<String> names = List.of("Alice", "Bob", "Charlie");
boolean allCapitalized = names.stream()
    .allMatch(s -> Character.isUpperCase(s.charAt(0))); // true

// ZADANIE 3: Połącz wszystkie imiona przez ", " posortowane alfabetycznie:
String result = names.stream()
    .sorted()
    .collect(java.util.stream.Collectors.joining(", ")); // "Alice, Bob, Charlie"

// ZADANIE 4: Zlicz słowa w tekście:
String text = "the quick brown fox jumps over the lazy dog";
Map<String, Long> wordCount = Arrays.stream(text.split("\\s+"))
    .collect(java.util.stream.Collectors.groupingBy(
        w -> w,
        java.util.stream.Collectors.counting()
    ));
// {the=2, quick=1, brown=1, fox=1, ...}

// ZADANIE 5: Suma kwadratów liczb nieparzystych w [1,10]:
int sumOfOddSquares = IntStream.rangeClosed(1, 10)
    .filter(n -> n % 2 != 0)
    .map(n -> n * n)
    .sum(); // 1+9+25+49+81 = 165

// ZADANIE 6: Odwróć listę przez Stream:
List<Integer> reversed = IntStream.rangeClosed(1, 5)
    .boxed()
    .sorted(Comparator.reverseOrder())
    .collect(java.util.stream.Collectors.toList()); // [5,4,3,2,1]

// ZADANIE 7: Znalezienie drugiej największej liczby:
OptionalInt secondMax = IntStream.of(3, 1, 4, 1, 5, 9, 2, 6, 5, 3)
    .distinct()
    .sorted()
    .skip(IntStream.of(3,1,4,1,5,9,2,6,5,3).distinct().count() - 2)
    .findFirst(); // 6

// Lepsze podejście:
List<Integer> nums = List.of(3, 1, 4, 1, 5, 9, 2, 6, 5, 3);
OptionalInt second = nums.stream()
    .mapToInt(Integer::intValue)
    .distinct()
    .boxed()
    .sorted(Comparator.reverseOrder())
    .skip(1)
    .mapToInt(Integer::intValue)
    .findFirst(); // 6

// ZADANIE 8: Flatten i deduplicate:
List<List<Integer>> nested = List.of(
    List.of(1, 2, 3),
    List.of(2, 3, 4),
    List.of(3, 4, 5)
);
List<Integer> flat = nested.stream()
    .flatMap(List::stream)
    .distinct()
    .sorted()
    .collect(java.util.stream.Collectors.toList()); // [1,2,3,4,5]
```

**Podsumowanie kluczowych zasad Stream API:**

| Operacja | Typ | Short-circuit | Stateful |
|---|---|---|---|
| `filter` | Intermediate | ❌ | ❌ |
| `map` | Intermediate | ❌ | ❌ |
| `flatMap` | Intermediate | ❌ | ❌ |
| `distinct` | Intermediate | ❌ | ✅ |
| `sorted` | Intermediate | ❌ | ✅ |
| `limit` | Intermediate | ✅ | ✅ |
| `skip` | Intermediate | ❌ | ✅ |
| `peek` | Intermediate | ❌ | ❌ |
| `count` | Terminal | ❌ | - |
| `collect` | Terminal | ❌ | - |
| `forEach` | Terminal | ❌ | - |
| `reduce` | Terminal | ❌ | - |
| `findFirst` | Terminal | ✅ | - |
| `findAny` | Terminal | ✅ | - |
| `anyMatch` | Terminal | ✅ | - |
| `allMatch` | Terminal | ✅ | - |
| `noneMatch` | Terminal | ✅ | - |
| `min/max` | Terminal | ❌ | - |
