# Przewodnik egzaminacyjny Java — Część 6: Typy Generyczne
## (pytania 161–199)

---

## 1. Wprowadzenie do generyków

### Pytanie 161 — czym są generyki i dlaczego istnieją?

Generyki (Generics) zostały wprowadzone w Java 5, aby zapewnić **bezpieczeństwo typów w czasie kompilacji** bez potrzeby rzutowania. Przed generykami kod był pełen niebezpiecznych rzutowań:

```java
// PRZED generykami (Java 1.4 i wcześniej):
List list = new ArrayList();        // raw type — brak bezpieczeństwa typów
list.add("Hello");
list.add(42);                       // kompilator tego nie zatrzyma!
String s = (String) list.get(0);   // musimy rzutować
Integer i = (Integer) list.get(0); // ❌ ClassCastException w runtime!

// PO wprowadzeniu generyków (Java 5+):
List<String> typedList = new ArrayList<>();
typedList.add("Hello");
// typedList.add(42);               // ❌ BŁĄD KOMPILACJI — bezpiecznie!
String s2 = typedList.get(0);      // brak rzutowania — automatyczne!
```

**Korzyści generyków:**
1. **Bezpieczeństwo typów** — błędy wykrywane w czasie kompilacji, nie w runtime.
2. **Eliminacja rzutowania** — kod jest czytelniejszy.
3. **Reużywalność** — jedna implementacja dla wielu typów.
4. **Dokumentacja** — typy parametrów wyjaśniają intencję.

---

## 2. Parametry typów — konwencje nazewnictwa

### Pytanie 162 — standardowe nazwy parametrów typów

Java ma utrwalone konwencje dla nazw parametrów typów (jednoliterowe wielkie litery):

| Litera | Konwencja użycia | Przykład |
|---|---|---|
| `T` | Type — ogólny typ | `class Box<T>` |
| `E` | Element — elementy kolekcji | `interface List<E>` |
| `K` | Key — klucz mapy | `interface Map<K, V>` |
| `V` | Value — wartość mapy | `interface Map<K, V>` |
| `N` | Number — typ liczbowy | `class Counter<N extends Number>` |
| `R` | Return type — typ zwracany | `Function<T, R>` |
| `S`, `U`, `W` | Drugi, trzeci, czwarty typ | `BiFunction<T, U, R>` |

```java
// Klasa generyczna:
public class Pair<A, B> {
    private final A first;
    private final B second;

    public Pair(A first, B second) {
        this.first = first;
        this.second = second;
    }

    public A getFirst() { return first; }
    public B getSecond() { return second; }

    @Override
    public String toString() {
        return "(" + first + ", " + second + ")";
    }
}

// Użycie:
Pair<String, Integer> pair = new Pair<>("Alice", 30);
String name = pair.getFirst();  // String — bez rzutowania
Integer age = pair.getSecond(); // Integer — bez rzutowania

// Zagnieżdżona para:
Pair<Pair<String, Integer>, Boolean> nested = 
    new Pair<>(new Pair<>("Alice", 30), true);
```

---

## 3. Bounded Wildcards — granice dzikich kart

### Pytanie 163 — unbounded wildcard `<?>`

```java
// Unbounded wildcard — akceptuje każdy typ parametryczny:
static void printList(List<?> list) {
    for (Object elem : list) {
        System.out.println(elem); // możemy tylko czytać jako Object
    }
}

// Użycie:
List<Integer> ints = List.of(1, 2, 3);
List<String> strings = List.of("a", "b", "c");
List<Double> doubles = List.of(1.1, 2.2);

printList(ints);     // ✅ OK
printList(strings);  // ✅ OK
printList(doubles);  // ✅ OK

// OGRANICZENIE unbounded wildcard:
static void tryModify(List<?> list) {
    // list.add("something"); // ❌ BŁĄD — nie wiadomo jakiego typu jest lista!
    // list.add(null);        // ✅ null jest jedynym dozwolonym elementem
    Object obj = list.get(0); // ✅ OK — zawsze możemy odczytać jako Object
}
```

---

### Pytanie 164 — upper bounded wildcard `<? extends T>`

```java
// Upper bounded wildcard — akceptuje T i wszystkie podtypy T:
static double sumList(List<? extends Number> list) {
    double sum = 0;
    for (Number n : list) {
        sum += n.doubleValue(); // Number ma doubleValue()
    }
    return sum;
}

// Użycie — wszystkie podtypy Number:
List<Integer> ints = List.of(1, 2, 3);
List<Double> doubles = List.of(1.5, 2.5);
List<Long> longs = List.of(100L, 200L);

sumList(ints);    // ✅ Integer extends Number
sumList(doubles); // ✅ Double extends Number
sumList(longs);   // ✅ Long extends Number

// OGRANICZENIE — nie możemy dodawać elementów:
static void tryAdd(List<? extends Number> list) {
    // list.add(3.14);     // ❌ BŁĄD — nie wiemy czy to List<Integer>, List<Double>...
    // list.add(new Integer(5)); // ❌ BŁĄD
    Number n = list.get(0);   // ✅ OK — zawsze możemy czytać jako Number
}
```

---

### Pytanie 165 — lower bounded wildcard `<? super T>`

```java
// Lower bounded wildcard — akceptuje T i wszystkie nadtypy T:
static void addNumbers(List<? super Integer> list) {
    // Możemy DODAWAĆ Integer i podtypy Integer:
    list.add(1);
    list.add(2);
    list.add(3);
    // Nie możemy bezpiecznie CZYTAĆ (tylko jako Object):
    Object obj = list.get(0); // ✅ OK — ale tylko jako Object
    // Integer n = list.get(0); // ❌ BŁĄD — mogłaby to być List<Number>
}

// Użycie:
List<Integer> intList = new ArrayList<>();
List<Number> numList = new ArrayList<>();
List<Object> objList = new ArrayList<>();

addNumbers(intList);  // ✅ List<Integer> — Integer super Integer
addNumbers(numList);  // ✅ List<Number> — Number super Integer
addNumbers(objList);  // ✅ List<Object> — Object super Integer

// List<Double> doubleList = new ArrayList<>();
// addNumbers(doubleList); // ❌ BŁĄD — Double nie jest nadtypem Integer
```

---

## 4. PECS — Producer Extends, Consumer Super

### Pytanie 166 — zasada PECS

PECS to mnemonika pomagająca zapamiętać kiedy używać `extends` a kiedy `super`:

> **P**roducer **E**xtends, **C**onsumer **S**uper

```java
// PRODUCER (produkuje/dostarcza dane do nas) — używaj ? extends:
static <T> void copy(List<? extends T> source, List<? super T> destination) {
    //                ^^^^^^^^^^^^^^^^^^^              ^^^^^^^^^^^^^^^^
    //                source = producer               destination = consumer
    //                (skąd bierzemy dane)            (gdzie wkładamy dane)

    for (T item : source) {      // czytamy z source — producer extends
        destination.add(item);   // zapisujemy do destination — consumer super
    }
}

// Konkretny przykład:
static double sumNumbers(List<? extends Number> numbers) {  // PRODUCER — extends
    return numbers.stream()
                  .mapToDouble(Number::doubleValue)
                  .sum();
}

static void fillWithDefaults(List<? super Integer> list, int count) { // CONSUMER — super
    for (int i = 0; i < count; i++) {
        list.add(0); // dodajemy Integer do listy (consumer)
    }
}

// Zapamiętaj:
// - get() z listy → ? extends (odczyt → Producer Extends)
// - add() do listy → ? super (zapis → Consumer Super)
// - oba get() i add() → T (konkretny typ)
// - tylko get() jako Object → ? (unbounded wildcard)
```

---

## 5. Type Erasure — wymazywanie typów

### Pytanie 167 — co się dzieje z generykami w runtime?

**Type erasure** to mechanizm, przez który Java usuwa informacje o parametrach typów podczas kompilacji. Wszystkie typy generyczne są "wymazywane" do ich granic (lub `Object` jeśli brak granicy):

```java
// Kod który piszemy:
public class Box<T> {
    private T value;
    public void set(T value) { this.value = value; }
    public T get() { return value; }
}

// Co kompilator generuje po type erasure (przybliżone):
public class Box {                      // T jest wymazane
    private Object value;               // T → Object (brak granicy)
    public void set(Object value) { this.value = value; }
    public Object get() { return value; } // + niejawne rzutowanie przy wywołaniu
}

// Z ograniczeniem:
public class NumberBox<T extends Number> {
    private T value;
    public T get() { return value; }
}
// Po erasure:
public class NumberBox {
    private Number value;               // T → Number (upper bound)
    public Number get() { return value; }
}
```

**Konsekwencje type erasure:**

```java
// 1. instanceof nie działa z parametrami typów:
List<String> list = new ArrayList<>();
// if (list instanceof List<String>) { }   // ❌ BŁĄD KOMPILACJI
if (list instanceof List<?>) { }            // ✅ OK — unbounded wildcard
if (list instanceof List) { }               // ✅ OK — raw type

// 2. Nie można tworzyć instancji parametru typów:
class Box<T> {
    // T obj = new T(); // ❌ BŁĄD — nie wiadomo jakiego typu T w runtime
    // T[] arr = new T[10]; // ❌ BŁĄD — nie można tworzyć tablic generyków

    // Obejście 1: przez refleksję
    T createByReflection(Class<T> clazz) throws Exception {
        return clazz.getDeclaredConstructor().newInstance();
    }

    // Obejście 2: przez Supplier
    T createBySupplier(java.util.function.Supplier<T> factory) {
        return factory.get();
    }
}

// 3. Metody generyczne mogą mieć te same sygnatury po erasure → błąd:
class Ambiguous {
    // void process(List<String> list) { }
    // void process(List<Integer> list) { } // ❌ BŁĄD — po erasure obie to List
}

// 4. Statyczne pola nie mogą być parametrami typów:
class Bad<T> {
    // static T instance; // ❌ BŁĄD — T jest per-instancja, static jest per-klasa
}
```

---

## 6. Generic Methods vs Generic Classes

### Pytanie 168 — metody generyczne

Metody generyczne mają własne parametry typów, niezależne od klasy:

```java
// Metoda generyczna — parametr <T> przed typem zwracanym:
public class Utils {
    // <T> to parametr typów METODY (nie klasy):
    public static <T> T firstElement(List<T> list) {
        if (list.isEmpty()) throw new NoSuchElementException();
        return list.get(0);
    }

    // Wiele parametrów typów:
    public static <K, V> Map<V, K> invertMap(Map<K, V> map) {
        Map<V, K> result = new HashMap<>();
        map.forEach((k, v) -> result.put(v, k));
        return result;
    }

    // Z ograniczeniami:
    public static <T extends Comparable<T>> T max(T a, T b) {
        return a.compareTo(b) >= 0 ? a : b;
    }

    // Bounded — T musi implementować interfejsy:
    public static <T extends Comparable<T> & java.io.Serializable> T clampedMax(T a, T b) {
        return max(a, b); // T jest i Comparable i Serializable
    }
}

// Wywołanie — inferencja typów (nie trzeba podawać explicite):
String first = Utils.firstElement(List.of("a", "b", "c")); // T inferowane jako String
Integer max = Utils.max(3, 7);                              // T inferowane jako Integer

// Explicite podanie typu (rzadko potrzebne):
String firstExplicit = Utils.<String>firstElement(List.of("x", "y"));
```

---

## 7. Wildcard Capture

### Pytanie 169 — przechwytywanie wieloznacznika

Kompilator czasem musi "przechwycić" typ wieloznacznikowy, by móc pracować z konkretnym typem:

```java
// Problem — ten kod nie skompiluje się:
static void swap(List<?> list, int i, int j) {
    // Object temp = list.get(i);
    // list.set(i, list.get(j)); // ❌ BŁĄD — nie możemy add/set do List<?>
    // list.set(j, temp);        // ❌ BŁĄD
}

// Rozwiązanie — helper method z przechwytywaniem:
static void swap(List<?> list, int i, int j) {
    swapHelper(list, i, j); // delegacja do metody z konkretnym T
}

// Kompilator "chwyta" ? i nadaje mu konkretny typ T
private static <T> void swapHelper(List<T> list, int i, int j) {
    T temp = list.get(i);
    list.set(i, list.get(j));
    list.set(j, temp);
}

// Inny przykład — odwracanie listy:
static void reverse(List<?> list) {
    reverseHelper(list);
}

private static <T> void reverseHelper(List<T> list) {
    for (int i = 0, j = list.size() - 1; i < j; i++, j--) {
        T temp = list.get(i);
        list.set(i, list.get(j));
        list.set(j, temp);
    }
}
```

---

## 8. Raw Types i Unchecked Warnings

### Pytanie 170 — surowe typy (raw types)

**Raw type** to użycie klasy/interfejsu generycznego bez parametrów typów. Zachowane dla kompatybilności wstecznej z kodem sprzed Java 5:

```java
// ❌ Raw type — stary styl, UNIKAJ:
List rawList = new ArrayList();
rawList.add("Hello");
rawList.add(42);       // kompilator pozwala — brak bezpieczeństwa typów!
String s = (String) rawList.get(0); // ryzyko ClassCastException

// Unchecked warning:
List<String> typed = rawList; // ⚠️ unchecked conversion warning!
rawList.add(123);              // może dodać do typed jako Integer!

// @SuppressWarnings("unchecked") — wyciszanie ostrzeżeń (ostrożnie!):
@SuppressWarnings("unchecked")
List<String> suppressedList = rawList; // bez ostrzeżenia

// Raw type vs wildcard:
void processRaw(List list) {   // raw type — niebezpieczny, NIE zalecany
    list.add("anything");      // kompilator nie sprawdza typów
}

void processWildcard(List<?> list) { // wildcard — bezpieczny
    // list.add("anything");         // ❌ BŁĄD — kompilator chroni
    Object obj = list.get(0);        // ✅ OK — tylko jako Object
}
```

**Dlaczego unikać raw types:**

1. Utrata bezpieczeństwa typów — błędy w runtime zamiast kompilacji.
2. Generuje ostrzeżenia kompilatora.
3. Niemożliwe do użycia z nowymi feature'ami (pattern matching, sealed classes).
4. Zaciemnia intencję kodu.

---

## 9. Reifiable vs Non-Reifiable Types

### Pytanie 171 — typy reifikowalne i niereifikowalne

**Reifiable type** — typ, o którym pełne informacje są dostępne w runtime (po type erasure).

```java
// Reifiable types (informacje dostępne w runtime):
int, double, String, List, List<?>, List<? extends Object>
// Wszystkie raw types, prymitywy i ich tablice, nieograniczone wieloznaczniki

// Non-reifiable types (częściowo "wymazane" przez erasure):
List<String>, List<Integer>, Map<String, Integer>
// Wszelkie parametryzowane typy z konkretnymi argumentami

// Praktyczne implikacje:
Object[] objectArray = new String[10]; // ✅ OK — tablice są reifiable (covariant)
// List<Object>[] arrayOfList = new List<String>[10]; // ❌ BŁĄD — non-reifiable

// Varargs z generykami (heap pollution warning):
@SafeVarargs // eliminuje ostrzeżenie gdy metoda jest bezpieczna
static <T> List<T> createList(T... elements) {
    // UWAGA: T... jest wewnętrznie tablicą T — ryzyko heap pollution
    return Arrays.asList(elements);
}

// Heap pollution — gdy zmienna List<String> wskazuje na List<Integer>:
List<String>[] arr = (List<String>[]) new List[2]; // raw type cast
arr[0] = new ArrayList<String>();
Object[] objArr = arr; // OK — tablice są covariant
objArr[1] = new ArrayList<Integer>(); // heap pollution!
String s = arr[1].get(0); // ❌ ClassCastException w runtime!
```

---

## 10. Generyki i tablice — dlaczego nie można tworzyć?

### Pytanie 172 — zakaz tworzenia tablic generyków

```java
// ❌ NIEMOŻLIWE — tworzenie tablic z parametrami typów:
// List<String>[] array = new List<String>[10]; // BŁĄD KOMPILACJI
// T[] arr = new T[10];                         // BŁĄD (w metodzie/klasie generycznej)

// Powód — spójrzmy na problem:
// Gdyby to było możliwe:
List<String>[] stringLists = new List<String>[1]; // (hipotetycznie)
Object[] objects = stringLists;      // tablice są covariant — OK
objects[0] = new ArrayList<Integer>(); // po erasure List<Integer> = List — OK w runtime!
String s = stringLists[0].get(0);     // ❌ ClassCastException — ale gdzie ostrzeżenie?

// Java chroni nas przed tym przez zakaz tworzenia tablic generyków.

// Alternatywy:
// 1. Użyj List<List<String>> zamiast List<String>[]:
List<List<String>> listOfLists = new ArrayList<>();

// 2. Raw type + rzutowanie (unchecked, ale czasem konieczne):
@SuppressWarnings("unchecked")
List<String>[] rawArray = new List[10]; // raw type array — OK z ostrzeżeniem

// 3. Użyj Object[] i rzutuj:
Object[] arr = new Object[10];
arr[0] = new ArrayList<String>();

// 4. Reflection (gdy naprawdę potrzebna tablica T[]):
@SuppressWarnings("unchecked")
static <T> T[] createArray(Class<T> type, int size) {
    return (T[]) java.lang.reflect.Array.newInstance(type, size);
}
String[] strings = createArray(String.class, 10);
```

---

## 11. Covariance i Contravariance

### Pytanie 173 — wariantność w Javie

```java
// COVARIANCE — "większy" typ akceptuje mniejszy (subtype relationship):
// W Javie: tablice są covariant, generyki NIE są (domyślnie), wildcard extends jest covariant

// Tablice — COVARIANT (niebezpieczne!):
String[] strings = new String[3];
Object[] objects = strings;           // ✅ OK — String[] IS-A Object[]
objects[0] = "Hello";                 // ✅ OK
// objects[0] = 42;                   // ❌ ArrayStoreException w runtime!

// Generyki — INVARIANT (domyślnie):
List<String> stringList = new ArrayList<>();
// List<Object> objectList = stringList; // ❌ BŁĄD KOMPILACJI — nie jest covariant!
// List<Object> jest INNYM typem niż List<String>

// Upper wildcard — covariant:
List<? extends Number> numList = new ArrayList<Integer>(); // ✅
numList = new ArrayList<Double>();   // ✅
// numList.add(3.14);                // ❌ — nie wiemy dokładnie jaki typ

// Lower wildcard — contravariant:
List<? super Integer> superList = new ArrayList<Number>(); // ✅
superList = new ArrayList<Object>(); // ✅
superList.add(42);                   // ✅ — możemy dodawać Integer

// Podsumowanie wariantności:
// String IS-A Object
// String[] IS-A Object[]             (tablice — covariant, niebezpieczne)
// List<String> NIE IS-A List<Object> (generyki — invariant)
// List<String> IS-A List<? extends Object> (upper wildcard — covariant)
// List<Object> IS-A List<? super String>   (lower wildcard — contravariant)
```

---

## 12. Bridge Methods

### Pytanie 174 — metody mostkowe generowane przez kompilator

Kompilator generuje **bridge methods** gdy klasa dziedzicząca po generycznej nadklasie/interfejsie nadpisuje metodę z parametrami typów:

```java
// Interfejs generyczny:
interface Comparable<T> {
    int compareTo(T other);
}

// Implementacja:
class Integer implements Comparable<Integer> {
    private int value;

    @Override
    public int compareTo(Integer other) { // nasza implementacja
        return Integer.compare(this.value, other.value);
    }
}

// Co kompilator FAKTYCZNIE generuje:
class Integer implements Comparable<Integer> {
    private int value;

    // Nasza implementacja:
    public int compareTo(Integer other) { ... }

    // Bridge method — generowana przez kompilator dla type erasure:
    // Umożliwia wywoływanie przez referencję Comparable (raw type):
    public int compareTo(Object other) {  // bridge — deleguje do naszej implementacji
        return compareTo((Integer) other); // rzutowanie + delegacja
    }
}

// Dlaczego bridge methods istnieją?
// Po type erasure, interfejs Comparable ma: int compareTo(Object other)
// Nasza klasa ma: int compareTo(Integer other)
// To dwie różne sygnatury! Bridge method "łączy" je dla polimorfizmu.

// Widoczność bridge methods przez refleksję:
Method[] methods = Integer.class.getMethods();
for (Method m : methods) {
    if (m.getName().equals("compareTo")) {
        System.out.println(m + " isBridge=" + m.isBridge());
    }
}
```

---

## 13. Ograniczenia generyków

### Pytanie 175 — czego nie można robić z generykami

```java
class Box<T> {
    private T value;

    // ❌ 1. Nie można tworzyć instancji parametru typu:
    // T obj = new T(); // BŁĄD — T jest wymazane w runtime

    // ❌ 2. Nie można tworzyć tablic parametru typu:
    // T[] arr = new T[10]; // BŁĄD

    // ❌ 3. Nie można używać w instanceof z konkretnym typem:
    // boolean b = value instanceof T; // BŁĄD

    // ❌ 4. Parametry typów nie mogą być prymitywami:
    // Box<int> box = new Box<>(); // BŁĄD — musi być Integer
    Box<Integer> intBox = new Box<>(); // ✅ OK — wrapper class

    // ❌ 5. Statyczne pola nie mogą być parametrami typów:
    // static T staticValue; // BŁĄD

    // ❌ 6. Nie można catch/throw z parametrem typu:
    // try { } catch (T e) { } // BŁĄD

    // ✅ Ale można deklarować throws z bounded T:
    <E extends Exception> void riskyOp() throws E { }

    // ✅ Można tworzyć instancje przez Supplier lub refleksję:
    T createNew(java.util.function.Supplier<T> factory) {
        return factory.get(); // ✅ OK
    }

    // ✅ Można porównywać przez equals():
    boolean isEqual(T other) {
        return value != null && value.equals(other); // ✅ OK
    }
}

// ❌ 7. Nie można przeciążać metod które różnią się tylko parametrem typów:
class Overloaded {
    // void process(List<String> list) { }
    // void process(List<Integer> list) { } // ❌ po erasure obie to List
}
```

---

## 14. Multiple Bounds

### Pytanie 176 — wielokrotne ograniczenia typów

```java
// Typ T musi rozszerzać klasę A ORAZ implementować interfejsy B i C:
// Klasa (jeśli jest) musi być PIERWSZA, potem interfejsy po &:

// T extends ClassA & InterfaceB & InterfaceC
// Uwaga: tylko jedna klasa (lub zero), wiele interfejsów

interface Printable { void print(); }
interface Saveable { void save(); }
abstract class Document { abstract String getContent(); }

// Klasa + interfejs:
static <T extends Document & Printable> void printDocument(T doc) {
    System.out.println(doc.getContent()); // metoda z Document
    doc.print();                           // metoda z Printable
}

// Dwa interfejsy (brak klasy):
static <T extends Printable & Saveable> void printAndSave(T item) {
    item.print();
    item.save();
}

// Z wieloma interfejsami:
static <T extends Comparable<T> & java.io.Serializable> T clampedMax(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}
// T musi być Comparable i Serializable — np. String, Integer, Long

// WAŻNE — kolejność: klasa zawsze PIERWSZA:
// <T extends Cloneable & Number> // ❌ BŁĄD — Number jest klasą, Cloneable interfejsem
// <T extends Number & Cloneable> // ✅ OK — klasa (Number) na pierwszym miejscu
```

---

## 15. Generyczne interfejsy i dziedziczenie

### Pytanie 177 — hierarchia klas generycznych

```java
// Klasa generyczna dziedzicząca po generycznej:
class Container<T> {
    protected T value;
    Container(T value) { this.value = value; }
    T get() { return value; }
}

// 1. Dziedziczenie z zachowaniem parametru:
class NamedContainer<T> extends Container<T> {
    private String name;
    NamedContainer(String name, T value) {
        super(value);
        this.name = name;
    }
    String getName() { return name; }
}

// 2. Dziedziczenie z "ustaleniem" parametru:
class StringContainer extends Container<String> {
    StringContainer(String value) { super(value); }
    void printUpperCase() { System.out.println(value.toUpperCase()); }
}

// 3. Klasa generyczna implementująca generyczny interfejs:
interface Repository<T, ID> {
    T findById(ID id);
    void save(T entity);
}

class GenericRepository<T, ID> implements Repository<T, ID> {
    private Map<ID, T> store = new HashMap<>();

    @Override
    public T findById(ID id) { return store.get(id); }

    @Override
    public void save(T entity) {
        // ID musiałoby być inaczej pobrane — uproszczony przykład
    }
}

// 4. Z ustaleniem typów:
class UserRepository extends GenericRepository<String, Integer> {
    // T = String, ID = Integer
}
```

---

## 16. Generyki i kolekcje — praktyczne wzorce

### Pytanie 178 — generyczne metody pomocnicze

```java
// Generyczna metoda filtrowania:
static <T> List<T> filter(List<T> list, java.util.function.Predicate<? super T> predicate) {
    return list.stream().filter(predicate).collect(java.util.stream.Collectors.toList());
}

// Generyczna metoda transformacji:
static <T, R> List<R> transform(List<T> list, java.util.function.Function<? super T, ? extends R> mapper) {
    return list.stream().map(mapper).collect(java.util.stream.Collectors.toList());
}

// Generyczna metoda grupowania:
static <T, K> Map<K, List<T>> groupBy(List<T> list, java.util.function.Function<? super T, ? extends K> classifier) {
    return list.stream().collect(java.util.stream.Collectors.groupingBy(classifier));
}

// Użycie:
List<String> names = List.of("Alice", "Bob", "Anna", "Charlie");
List<String> aNames = filter(names, s -> s.startsWith("A")); // [Alice, Anna]
List<Integer> lengths = transform(names, String::length);     // [5, 3, 4, 7]
Map<Integer, List<String>> byLength = groupBy(names, String::length); // {5=[Alice], 3=[Bob], ...}
```

---

## 17. Rekurencja generyków (F-bounded polymorphism)

### Pytanie 179 — self-referential generic bounds

```java
// F-bounded polymorphism — klasa parametryzowana samą sobą:
// Używane w Comparable, Enum, Builder pattern

// Comparable w JDK:
// public interface Comparable<T> { int compareTo(T o); }
// class Integer implements Comparable<Integer> { ... }
// Wymaga: T extends Comparable<T>

// Wzorzec Builder z F-bounded:
abstract class Builder<T, B extends Builder<T, B>> {
    protected String name;

    @SuppressWarnings("unchecked")
    public B withName(String name) {
        this.name = name;
        return (B) this; // zwraca konkretny Builder (this jest B)
    }

    public abstract T build();
}

class PersonBuilder extends Builder<Person, PersonBuilder> {
    private int age;

    public PersonBuilder withAge(int age) {
        this.age = age;
        return this; // zwraca PersonBuilder, nie Builder (fluent API)
    }

    @Override
    public Person build() {
        return new Person(name, age);
    }
}

// Użycie — fluent API działa poprawnie:
Person person = new PersonBuilder()
    .withName("Alice")  // zwraca PersonBuilder (nie Builder!)
    .withAge(30)        // metoda PersonBuilder dostępna
    .build();
```

---

## 18. Generic Classes w bibliotekach JDK

### Pytanie 180 — przykłady z JDK

```java
// java.util.Optional<T>:
Optional<String> opt = Optional.of("Hello");
Optional<Integer> length = opt.map(String::length);         // Function<String, Integer>
Optional<String> filtered = opt.filter(s -> s.length() > 3); // Predicate<String>

// java.util.concurrent.Future<V>:
java.util.concurrent.ExecutorService exec = java.util.concurrent.Executors.newFixedThreadPool(2);
java.util.concurrent.Future<String> future = exec.submit(() -> "Result");
String result = future.get(); // blokuje, zwraca V

// java.util.function.Function<T,R> — już omówione

// java.lang.Comparable<T>:
class Temperature implements Comparable<Temperature> {
    private double celsius;
    Temperature(double c) { this.celsius = c; }

    @Override
    public int compareTo(Temperature other) {
        return Double.compare(this.celsius, other.celsius);
    }
}

List<Temperature> temps = new ArrayList<>(
    List.of(new Temperature(20), new Temperature(5), new Temperature(35))
);
Collections.sort(temps); // używa compareTo() — natural ordering
```

---

## 19. Wzorzec Repository z generykami

### Pytanie 181 — generyczne repozytorium CRUD

```java
interface Entity<ID> {
    ID getId();
}

interface CrudRepository<T extends Entity<ID>, ID> {
    void save(T entity);
    Optional<T> findById(ID id);
    List<T> findAll();
    void deleteById(ID id);
    boolean existsById(ID id);
}

class InMemoryCrudRepository<T extends Entity<ID>, ID> implements CrudRepository<T, ID> {
    private final Map<ID, T> storage = new HashMap<>();

    @Override
    public void save(T entity) { storage.put(entity.getId(), entity); }

    @Override
    public Optional<T> findById(ID id) { return Optional.ofNullable(storage.get(id)); }

    @Override
    public List<T> findAll() { return new ArrayList<>(storage.values()); }

    @Override
    public void deleteById(ID id) { storage.remove(id); }

    @Override
    public boolean existsById(ID id) { return storage.containsKey(id); }
}

// Konkretne repozytorium:
class User implements Entity<Long> {
    private Long id;
    private String name;
    User(Long id, String name) { this.id = id; this.name = name; }
    @Override public Long getId() { return id; }
}

class UserRepository extends InMemoryCrudRepository<User, Long> {
    // Można dodać metody specyficzne dla User:
    List<User> findByName(String name) {
        return findAll().stream()
                        .filter(u -> u.name.equals(name))
                        .collect(java.util.stream.Collectors.toList());
    }
}
```

---

## 20. Generyki — zaawansowane przypadki egzaminacyjne

### Pytanie 182 — co się kompiluje, co nie?

```java
// Pytania egzaminacyjne — co jest poprawne?

// 1. Raw type assignment:
List<String> strings = new ArrayList<>();
List raw = strings; // ✅ OK — warning: unchecked
strings = raw;      // ✅ OK — warning: unchecked

// 2. Wildcard assignment:
List<? extends Number> nums = new ArrayList<Integer>(); // ✅ OK
// List<Number> numList = new ArrayList<Integer>();      // ❌ BŁĄD — invariant

// 3. Nested wildcards:
List<List<?>> listOfLists = new ArrayList<List<?>>(); // ✅ OK
listOfLists.add(new ArrayList<String>());   // ✅ OK
listOfLists.add(new ArrayList<Integer>());  // ✅ OK

// 4. Wildcard capture:
// List<? extends Number> list = new ArrayList<Integer>();
// list.add(3.14); // ❌ BŁĄD — nie wiemy dokładnie jaki typ

// 5. Generyczna metoda vs wildcard:
// Te dwie sygnatury są NIE równoważne:
static <T> void methodA(List<T> list1, List<T> list2) {
    // OBIE listy MUSZĄ być tego samego T
    list1.add(list2.get(0)); // ✅ OK — T jest znane
}
static void methodB(List<?> list1, List<?> list2) {
    // Lista1 i lista2 mogą być różnych typów
    // list1.add(list2.get(0)); // ❌ BŁĄD — ? i ? mogą być różne
}

// 6. ? extends vs konkretny typ:
static <T extends Number> void m1(List<T> list) {
    T first = list.get(0); // ✅ — typ T
    list.add(first);       // ✅ — możemy dodać T
}
static void m2(List<? extends Number> list) {
    Number first = list.get(0); // ✅ — jako Number
    // list.add(first);         // ❌ — nie możemy dodać do ? extends
}
```

---

## 21. Generyki a varargs

### Pytanie 183 — @SafeVarargs i heap pollution

```java
// Varargs z typem generycznym — potencjalne heap pollution:
// ❌ Niebezpieczne:
static <T> List<T> asList(T... elements) {
    // T... jest faktycznie T[] — tablica generyku!
    // Kompilator ostrzega: "unchecked or unsafe operations"
    return Arrays.asList(elements);
}

// Ostrzeżenie: "Possible heap pollution from parameterized vararg type"

// @SafeVarargs — informuje kompilator że metoda jest bezpieczna:
@SafeVarargs
static <T> List<T> safeAsList(T... elements) {
    // ✅ OK — używamy tablicy tylko do odczytu
    return new ArrayList<>(Arrays.asList(elements));
}

// @SafeVarargs można stosować tylko dla:
// - metod statycznych
// - metod final
// - konstruktorów
// (nie dla zwykłych nadpisywalnych metod)

// Kiedy NIE jest bezpieczne (heap pollution):
@SuppressWarnings("unchecked")
static <T> T[] unsafeToArray(T... args) {
    return args; // ❌ NIEBEZPIECZNE — zwracamy tablicę generyczną!
}

// Problem:
String[] strings = unsafeToArray("a", "b"); // W teorii OK
// Ale:
Object[] objs = unsafeToArray("a", 42); // ❌ heap pollution!
```

---

## 22. Typ Any (universal) przez generyki

### Pytanie 184 — generyczny Pair, Triple, Either

```java
// Generyczne kontenery danych:
record Pair<A, B>(A first, B second) {
    public static <A, B> Pair<A, B> of(A a, B b) {
        return new Pair<>(a, b);
    }

    public Pair<B, A> swap() {
        return new Pair<>(second, first);
    }

    public <C> Pair<A, C> mapSecond(java.util.function.Function<B, C> f) {
        return new Pair<>(first, f.apply(second));
    }
}

// Either<L, R> — lewa lub prawa wartość (używane w FP):
sealed interface Either<L, R> permits Either.Left, Either.Right {
    record Left<L, R>(L value) implements Either<L, R> {}
    record Right<L, R>(R value) implements Either<L, R> {}

    static <L, R> Either<L, R> left(L value) { return new Left<>(value); }
    static <L, R> Either<L, R> right(R value) { return new Right<>(value); }

    default boolean isLeft() { return this instanceof Left; }
    default boolean isRight() { return this instanceof Right; }
}

// Użycie — Either do obsługi błędów:
Either<String, Integer> parse(String input) {
    try {
        return Either.right(Integer.parseInt(input));
    } catch (NumberFormatException e) {
        return Either.left("Not a number: " + input);
    }
}

Either<String, Integer> result = parse("42");   // Right(42)
Either<String, Integer> error = parse("abc");   // Left("Not a number: abc")
```

---

## 23. Generyki w standardowych algorytmach

### Pytanie 185 — Collections utility methods

```java
// Collections.sort() — wymaga Comparable lub Comparator:
static <T extends Comparable<? super T>> void sort(List<T> list)
// Dlaczego ? super T? PECS — T musi być "konsumentem" porównań
// Pozwala sortować List<Integer> nawet gdy Comparable jest zdefiniowane w Number

List<Integer> numbers = new ArrayList<>(List.of(3, 1, 4, 1, 5));
Collections.sort(numbers); // T = Integer, Integer extends Comparable<Integer>

// Collections.min/max:
static <T extends Object & Comparable<? super T>> T min(Collection<? extends T> coll)
// ? extends T — PECS (kolekcja jest producentem)
// Comparable<? super T> — T może porównywać ze swoimi nadtypami (PECS consumer)

// Collections.binarySearch() — lista MUSI być posortowana:
int idx = Collections.binarySearch(numbers, 4); // zwraca indeks

// Collections.copy():
static <T> void copy(List<? super T> dest, List<? extends T> src)
// dest = consumer → super T
// src = producer → extends T
// PECS w praktyce!

Collections.copy(new ArrayList<>(Arrays.asList(0, 0, 0, 0, 0)), numbers);
```

---

## 24. Generyki — podsumowanie zasad egzaminacyjnych

### Pytanie 186–199 — kluczowe zasady

```java
// ===== TYPE PARAMETERS =====
class Box<T> { }
// T — unbounded: akceptuje każdy typ
// T extends Number — upper bound: T jest Number lub podtypem
// T extends A & B & C — multiple bounds: T spełnia wszystkie

// ===== WILDCARDS =====
// List<?>             — nieznany typ, tylko null/Object
// List<? extends T>   — T lub podtyp (read-only praktycznie, PRODUCER)
// List<? super T>     — T lub nadtyp (write-friendly, CONSUMER)

// ===== OGRANICZENIA RUNTIME =====
// instanceof z parametrem typów — NIEMOŻLIWE
// new T() — NIEMOŻLIWE
// new T[n] — NIEMOŻLIWE
// static T field — NIEMOŻLIWE
// catch (T e) — NIEMOŻLIWE
// List<String>[] — NIEMOŻLIWE

// ===== TYPE ERASURE =====
// List<String> → List (raw) w runtime
// T → Object (lub upper bound) w bytecode
// Bridge methods — generowane dla polimorfizmu

// ===== COVARIANCE =====
// String[] IS-A Object[] (tablice — covariant, ryzyko ArrayStoreException)
// List<String> NIE IS-A List<Object> (generyki — invariant)
// List<String> IS-A List<? extends Object> (upper wildcard)

// ===== PECS MNEMONIKA =====
// P-E-C-S: Producer Extends, Consumer Super
// Czytasz z kolekcji → ? extends (source)
// Zapisujesz do kolekcji → ? super (destination)
// Robisz obie → konkretny typ T

// ===== PORÓWNANIE List<?> vs List<Object> =====
void raw(List<Object> list) {
    list.add("Hello"); // ✅ OK — konkretny typ
    list.add(42);      // ✅ OK
    Object o = list.get(0); // ✅ OK
}

void wildcard(List<?> list) {
    // list.add("Hello"); // ❌ BŁĄD — nie wiemy jakiego typu
    // list.add(null);    // ✅ OK (null jest każdym typem)
    Object o = list.get(0); // ✅ OK — jako Object
}
```

**Tabela porównawcza — kluczowe do zapamiętania:**

| Construct | Add elements | Get elements | Use case |
|---|---|---|---|
| `List<T>` | ✅ T | ✅ T | Konkretny znany typ |
| `List<Object>` | ✅ Object | ✅ Object | Heterogenna lista |
| `List<?>` | ❌ (tylko null) | ✅ Object | Tylko odczyt, dowolny typ |
| `List<? extends T>` | ❌ | ✅ T | Producer — źródło danych |
| `List<? super T>` | ✅ T | ✅ Object | Consumer — cel danych |
