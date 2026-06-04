# Przewodnik egzaminacyjny Java — Część 7: Kolekcje
## (pytania 200–219)

---

## 1. Hierarchia Collections Framework

### Pytanie 200 — mapa interfejsów Java Collections Framework

Zrozumienie hierarchii to fundament wszystkich pytań o kolekcje:

```
java.lang.Iterable<E>
└── java.util.Collection<E>
    ├── java.util.List<E>
    │   ├── ArrayList<E>        — tablica dynamiczna
    │   ├── LinkedList<E>       — lista dwukierunkowa (też Deque!)
    │   ├── Vector<E>           — stare, synchronized (unikaj)
    │   └── Stack<E>            — stare, extends Vector (unikaj, użyj Deque)
    │
    ├── java.util.Set<E>
    │   ├── HashSet<E>          — brak porządku, O(1) operacje
    │   ├── LinkedHashSet<E>    — insertion order, O(1) operacje
    │   └── java.util.SortedSet<E>
    │       └── java.util.NavigableSet<E>
    │           └── TreeSet<E>  — posortowany, O(log n) operacje
    │
    └── java.util.Queue<E>
        ├── PriorityQueue<E>    — kopiec (heap), minHeap domyślnie
        └── java.util.Deque<E>
            ├── ArrayDeque<E>   — wydajna kolejka/stos tablicowa
            └── LinkedList<E>   — też implementuje Deque!

java.util.Map<K,V>              — NIE extends Collection!
    ├── HashMap<K,V>            — brak porządku, O(1) operacje
    ├── LinkedHashMap<K,V>      — insertion/access order
    └── java.util.SortedMap<K,V>
        └── java.util.NavigableMap<K,V>
            └── TreeMap<K,V>    — posortowany wg kluczy, O(log n)
```

**KLUCZOWE:** `Map` NIE rozszerza `Collection`! To osobna hierarchia.

---

## 2. ArrayList vs LinkedList

### Pytanie 201 — kiedy ArrayList, kiedy LinkedList?

```java
// ArrayList — wewnętrznie to tablica Object[]:
List<String> arrayList = new ArrayList<>();
// Domyślna pojemność: 10
// Przy przepełnieniu: nowa tablica o pojemności * 1.5
// ALOKACJA z góry:
List<String> withCapacity = new ArrayList<>(1000); // unikamy wielokrotnych realokacji

// LinkedList — wewnętrznie lista dwukierunkowa (doubly linked):
List<String> linkedList = new LinkedList<>();
// Każdy element to węzeł: [prev | data | next]

// PORÓWNANIE WYDAJNOŚCI:
// ┌──────────────────────┬─────────────┬─────────────┐
// │ Operacja             │ ArrayList   │ LinkedList  │
// ├──────────────────────┼─────────────┼─────────────┤
// │ get(i)               │ O(1) ✅     │ O(n) ❌     │
// │ add(element) na końcu│ O(1) amort. │ O(1) ✅     │
// │ add(i, element)      │ O(n) ❌     │ O(n)        │
// │ remove(i)            │ O(n) ❌     │ O(n)        │
// │ remove() z początku  │ O(n) ❌     │ O(1) ✅     │
// │ contains(o)          │ O(n)        │ O(n)        │
// │ Pamięć               │ kompaktowa  │ duże narzuty│
// └──────────────────────┴─────────────┴─────────────┘

// Użycie ArrayList gdy:
// - Częsty dostęp przez indeks (get)
// - Rzadkie wstawianie/usuwanie w środku
// - Iteracja sekwencyjna (cache-friendly — ciągłe adresy pamięci)

// Użycie LinkedList gdy:
// - Częste wstawianie/usuwanie z obu końców (Deque operations)
// - NIE potrzebujesz dostępu przez indeks
// W praktyce: ArrayDeque jest ZAWSZE lepszy od LinkedList dla Deque/Queue!
```

---

## 3. HashSet vs TreeSet vs LinkedHashSet

### Pytanie 202 — kiedy które Set?

```java
// HashSet — opiera się na HashMap wewnętrznie:
Set<String> hashSet = new HashSet<>();
hashSet.add("Banana");
hashSet.add("Apple");
hashSet.add("Cherry");
// Brak gwarantowanej kolejności iteracji!
// ✅ Najszybszy: O(1) dla add, remove, contains
// ❌ Brak porządku iteracji

// LinkedHashSet — opiera się na LinkedHashMap:
Set<String> linkedHashSet = new LinkedHashSet<>();
linkedHashSet.add("Banana");
linkedHashSet.add("Apple");
linkedHashSet.add("Cherry");
// ✅ Zachowuje kolejność wstawiania (insertion order)
// ✅ O(1) dla add, remove, contains
// ❌ Minimalnie wolniejszy od HashSet (utrzymuje listę dwukierunkową)
for (String s : linkedHashSet) {
    System.out.print(s + " "); // "Banana Apple Cherry" — kolejność wstawiania
}

// TreeSet — opiera się na TreeMap (czerwono-czarne drzewo BST):
Set<String> treeSet = new TreeSet<>();
treeSet.add("Banana");
treeSet.add("Apple");
treeSet.add("Cherry");
// ✅ Posortowany (natural ordering lub Comparator)
// ✅ NavigableSet — floor, ceiling, headSet, tailSet
// ❌ O(log n) dla wszystkich operacji
for (String s : treeSet) {
    System.out.print(s + " "); // "Apple Banana Cherry" — posortowane!
}

// NavigableSet operations w TreeSet:
TreeSet<Integer> numbers = new TreeSet<>(List.of(5, 2, 8, 1, 9, 3));
System.out.println(numbers.first());           // 1 — najmniejszy
System.out.println(numbers.last());            // 9 — największy
System.out.println(numbers.floor(6));          // 5 — największy ≤ 6
System.out.println(numbers.ceiling(6));        // 8 — najmniejszy ≥ 6
System.out.println(numbers.lower(5));          // 3 — największy < 5
System.out.println(numbers.higher(5));         // 8 — najmniejszy > 5
System.out.println(numbers.headSet(5));        // [1, 2, 3] — elementy < 5
System.out.println(numbers.tailSet(5));        // [5, 8, 9] — elementy ≥ 5
System.out.println(numbers.subSet(3, 8));      // [3, 5] — elementy ≥ 3 i < 8
```

---

## 4. HashMap — mechanizm działania

### Pytanie 203 — jak działa HashMap wewnętrznie?

To jedno z **najczęstszych pytań** na rozmowach kwalifikacyjnych i egzaminach:

```java
// HashMap wewnętrznie to tablica kubełków (buckets):
// Node<K,V>[] table — tablica węzłów

// MECHANIZM:
// 1. Oblicz hash klucza: hash = key.hashCode()
// 2. "Spread" hasha: spread = hash ^ (hash >>> 16) — dla równomiernego rozkładu
// 3. Oblicz indeks: index = spread & (capacity - 1)
// 4. Wstaw węzeł do table[index]

// Parametry HashMap:
// initialCapacity — domyślnie 16
// loadFactor — domyślnie 0.75 (75% wypełnienia → resize)
// threshold = capacity * loadFactor → gdy size > threshold, resize!

HashMap<String, Integer> map = new HashMap<>(16, 0.75f); // default values

// KOLIZJE:
// Gdy dwa klucze trafiają do tego samego kubełka (ten sam hash & (cap-1)):
// - Java 7 i wcześniej: linked list w kubełku
// - Java 8+: linked list (≤ 8 elementów) → TreeNode gdy > 8 (balanced BST)

// RESIZE (rehash):
// Gdy size > loadFactor * capacity:
// 1. Stwórz nową tablicę 2x większą
// 2. Przerób (rehash) wszystkie elementy — O(n)!
// Amortyzowane: O(1) dla put/get

// DLACZEGO capacity musi być potęgą 2?
// index = hash & (capacity - 1) — wydajny modulo przez bitowe AND
// capacity = 16 → binarnie 10000, capacity-1 = 01111
// hash & 01111 → szybkie wybranie ostatnich 4 bitów

// Przykład kolizji:
class BadHashKey {
    private int value;
    BadHashKey(int v) { this.value = v; }

    @Override
    public int hashCode() { return 42; } // WSZYSTKIE obiekty mają hash 42!
    @Override
    public boolean equals(Object o) {
        if (!(o instanceof BadHashKey)) return false;
        return this.value == ((BadHashKey) o).value;
    }
}
// HashMap z tymi kluczami staje się O(n) — jeden kubełek z n elementami!
```

---

## 5. Kontrakt equals() i hashCode() w kolekcjach

### Pytanie 204 — equals/hashCode kontrakt

To fundamentalna zasada dla poprawnego działania kolekcji opartych na haszowaniu:

```java
// KONTRAKT:
// 1. Jeśli a.equals(b), to a.hashCode() == b.hashCode() MUSI być prawdą
// 2. Jeśli a.hashCode() == b.hashCode(), NIE MUSI być a.equals(b) (kolizja hashów)
// 3. hashCode() musi być spójny — wielokrotne wywołanie zwraca tę samą wartość
//    (chyba że pola używane w equals się zmieniły)

// Naruszenie kontraktu — BŁĄD:
class BrokenKey {
    String value;

    BrokenKey(String v) { this.value = v; }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof BrokenKey)) return false;
        return this.value.equals(((BrokenKey)o).value);
    }
    // ❌ BEZ hashCode! Używa domyślnego z Object (na podstawie adresu)
}

HashMap<BrokenKey, String> map = new HashMap<>();
BrokenKey k1 = new BrokenKey("test");
BrokenKey k2 = new BrokenKey("test");
map.put(k1, "value");
System.out.println(map.get(k2)); // null — k1.hashCode() != k2.hashCode()
                                  // Bo użyto domyślnego hashCode()!

// ✅ POPRAWNA implementacja:
class GoodKey {
    String value;

    GoodKey(String v) { this.value = v; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof GoodKey)) return false;
        return Objects.equals(this.value, ((GoodKey)o).value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value); // spójny z equals!
    }
}

HashMap<GoodKey, String> goodMap = new HashMap<>();
GoodKey g1 = new GoodKey("test");
GoodKey g2 = new GoodKey("test");
goodMap.put(g1, "value");
System.out.println(goodMap.get(g2)); // "value" ✅ — equals i hashCode spójne

// WAŻNE — zmienianie klucza po wstawieniu do HashMap:
GoodKey mutableKey = new GoodKey("original");
goodMap.put(mutableKey, "data");
mutableKey.value = "changed"; // ZMIANA klucza!
System.out.println(goodMap.get(mutableKey)); // null — hash się zmienił!
// Klucze HashMap powinny być NIEMUTOWALNE (lub przynajmniej stable hashCode)!
```

---

## 6. HashMap vs TreeMap vs LinkedHashMap

### Pytanie 205 — kiedy które Map?

```java
// HashMap — najczęściej używana:
Map<String, Integer> hashMap = new HashMap<>();
// ✅ O(1) put/get/containsKey — najszybsza
// ❌ Brak gwarantowanej kolejności iteracji
// ❌ Jeden klucz null, wiele wartości null

// LinkedHashMap — zachowuje kolejność:
Map<String, Integer> linkedHashMap = new LinkedHashMap<>();
// ✅ Zachowuje insertion order (domyślnie)
// ✅ LRU Cache — accessOrder=true!
// ❌ Minimalnie wolniejszy od HashMap
Map<String, Integer> accessOrderMap = new LinkedHashMap<>(16, 0.75f, true);
// true = accessOrder — elem przechodzą na koniec przy get/put
// Podstawa do implementacji LRU Cache!

// TreeMap — posortowany:
Map<String, Integer> treeMap = new TreeMap<>();
// ✅ Klucze posortowane (Comparable lub Comparator)
// ✅ NavigableMap — firstKey, lastKey, headMap, tailMap, floorKey, ceilingKey
// ❌ O(log n) — wolniejszy dla podstawowych operacji
// ❌ Klucze NIE mogą być null (NullPointerException przy porównaniu)

TreeMap<String, Integer> sorted = new TreeMap<>(Map.of("banana", 2, "apple", 5, "cherry", 1));
System.out.println(sorted.firstKey());           // "apple"
System.out.println(sorted.lastKey());            // "cherry"
System.out.println(sorted.floorKey("banana"));  // "banana"
System.out.println(sorted.ceilingKey("b"));     // "banana"
System.out.println(sorted.headMap("cherry"));   // {apple=5, banana=2}
System.out.println(sorted.tailMap("banana"));   // {banana=2, cherry=1}

// LRU Cache z LinkedHashMap:
class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    LRUCache(int capacity) {
        super(capacity, 0.75f, true); // accessOrder = true!
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity; // usuń najdawniej używany gdy przekroczymy limit
    }
}
```

---

## 7. ConcurrentHashMap

### Pytanie 206 — ConcurrentHashMap — bezpieczeństwo wątkowe

```java
import java.util.concurrent.ConcurrentHashMap;

// ConcurrentHashMap — thread-safe HashMap:
ConcurrentHashMap<String, Integer> concurrentMap = new ConcurrentHashMap<>();

// ✅ Bezpieczny dla wielowątkowego dostępu BEZ zewnętrznej synchronizacji
// ✅ Java 8+: nie blokuje całej mapy — używa CAS (Compare-And-Swap) na węzłach
// ❌ Nie pozwala na null klucze ani null wartości (HashMap pozwala jeden null klucz)

// Atomowe operacje:
concurrentMap.put("count", 0);
concurrentMap.putIfAbsent("newKey", 100);   // atomowo: wstaw jeśli brak klucza
concurrentMap.replace("count", 0, 1);       // atomowo: zamień gdy stara wartość = 0

// compute — atomowa operacja obliczeniowa:
concurrentMap.compute("count", (key, val) -> val == null ? 1 : val + 1);

// computeIfAbsent — atomowe tworzenie gdy brak:
concurrentMap.computeIfAbsent("groups", k -> 0);

// merge — atomowy merge:
concurrentMap.merge("count", 1, Integer::sum); // dodaj 1 do istniejącej wartości

// WAŻNE — NIE atomowe mimo nazwy:
// concurrentMap.get() + concurrentMap.put() = race condition!
// Musimy użyć atomowych metod: compute, putIfAbsent, replace

// Porównanie:
// HashMap — nie thread-safe
// Hashtable — thread-safe przez synchronized (stare, wolne)
// Collections.synchronizedMap(map) — synchronized wrapper, wolniejszy od ConcurrentHashMap
// ConcurrentHashMap — thread-safe, wysokowydajny (partycjonowany zamek w Java 7, CAS w Java 8+)
```

---

## 8. Niemutowalne kolekcje

### Pytanie 207 — unmodifiable vs immutable

```java
// Collections.unmodifiableList() — wrapper niemutowalny (NIE w pełni immutable!):
List<String> mutable = new ArrayList<>(List.of("a", "b", "c"));
List<String> unmodifiable = Collections.unmodifiableList(mutable);

// unmodifiable.add("d");  // ❌ UnsupportedOperationException
// Ale oryginalna lista może się zmieniać:
mutable.add("d");
System.out.println(unmodifiable); // [a, b, c, d] — WIDZI zmianę!
// unmodifiable to tylko VIEW na oryginał, nie kopia!

// List.of() (Java 9+) — prawdziwie niemutowalna:
List<String> immutableList = List.of("a", "b", "c");
// immutableList.add("d");  // ❌ UnsupportedOperationException
// immutableList.set(0, "x"); // ❌ UnsupportedOperationException
// Nie ma żywego powiązania z mutowalną listą

// Set.of() i Map.of():
Set<String> immutableSet = Set.of("a", "b", "c");
Map<String, Integer> immutableMap = Map.of("a", 1, "b", 2, "c", 3);
Map<String, Integer> mapWithEntry = Map.ofEntries(
    Map.entry("key1", 1),
    Map.entry("key2", 2)
);

// WAŻNE różnice:
// List.of() — nie pozwala na null! NullPointerException
// Collections.unmodifiableList() — null jest OK (zależy od oryginalnej listy)
// List.of() — kolejność elementów gwarantowana
// Set.of() / Map.of() — kolejność iteracji NIEGWARANTOWANA

// Porównanie:
// Collections.unmodifiableList — widok, zmiana oryginału widoczna
// List.of() — prawdziwie niemutowalna, oddzielna instancja
// List.copyOf() — niemutowalna kopia (jak List.of ale z kolekcji)
List<String> copyOfList = List.copyOf(mutable); // niemutowalna kopia
```

---

## 9. Iterator i ListIterator

### Pytanie 208 — iterowanie kolekcji

```java
// Iterator<E> — podstawowy iterator:
List<String> list = new ArrayList<>(List.of("a", "b", "c", "d"));
Iterator<String> iter = list.iterator();

while (iter.hasNext()) {
    String element = iter.next();
    System.out.println(element);
    if (element.equals("b")) {
        iter.remove(); // ✅ Bezpieczne usunięcie podczas iteracji!
    }
}
// list: [a, c, d]

// ConcurrentModificationException — co to i jak powstaje:
// ❌ BŁĄD — modyfikacja listy podczas iteracji:
for (String s : list) {
    if (s.equals("a")) {
        list.remove(s); // ❌ ConcurrentModificationException!
    }
}

// ✅ BEZPIECZNE sposoby usuwania podczas iteracji:
// 1. Iterator.remove():
Iterator<String> safe = list.iterator();
while (safe.hasNext()) {
    if (safe.next().equals("a")) safe.remove();
}

// 2. Collection.removeIf() (Java 8+):
list.removeIf(s -> s.equals("a")); // wewnętrznie używa Iterator.remove()

// 3. Zbierz do nowej listy (filter):
List<String> filtered = list.stream()
    .filter(s -> !s.equals("a"))
    .collect(java.util.stream.Collectors.toList());

// ListIterator — rozszerzony iterator dla List:
ListIterator<String> listIter = list.listIterator();
while (listIter.hasNext()) {
    String s = listIter.next();
    listIter.set(s.toUpperCase()); // ✅ Zamień bieżący element
    // listIter.add("X");          // ✅ Wstaw przed następnym
}

// ListIterator może też iterować wstecz:
while (listIter.hasPrevious()) {
    System.out.println(listIter.previous());
}
```

---

## 10. Comparable vs Comparator w sortowaniu

### Pytanie 209 — sortowanie kolekcji

```java
// Comparable — naturalne porządkowanie (implementowane przez klasę):
class Product implements Comparable<Product> {
    String name;
    double price;

    Product(String name, double price) { this.name = name; this.price = price; }

    @Override
    public int compareTo(Product other) {
        return Double.compare(this.price, other.price); // po cenie rosnąco
    }
}

List<Product> products = new ArrayList<>(
    List.of(new Product("C", 30.0), new Product("A", 10.0), new Product("B", 20.0))
);

// Sortowanie przez Comparable:
Collections.sort(products); // używa Product.compareTo()
products.sort(null);        // null = użyj natural ordering

// Comparator — zewnętrzne, elastyczne sortowanie:
Comparator<Product> byName = Comparator.comparing(p -> p.name);
Comparator<Product> byPriceDesc = Comparator.comparingDouble((Product p) -> p.price).reversed();
Comparator<Product> byNameThenPrice = Comparator
    .comparing((Product p) -> p.name)
    .thenComparingDouble(p -> p.price);

products.sort(byName);
products.sort(byPriceDesc);

// Collections.sort() z Comparator:
Collections.sort(products, byName);

// Arrays.sort() dla tablic:
Product[] arr = products.toArray(new Product[0]);
Arrays.sort(arr, byName);

// Sortowanie z nullami:
Comparator<Product> nullSafe = Comparator.nullsFirst(byName);
Comparator<Product> nullsLast = Comparator.nullsLast(byPriceDesc);
```

---

## 11. PriorityQueue

### Pytanie 210 — kolejka priorytetowa

```java
// PriorityQueue — kopiec binarny (min-heap domyślnie):
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.add(5);
minHeap.add(1);
minHeap.add(3);
minHeap.add(2);

System.out.println(minHeap.peek()); // 1 — podejrzyj minimum bez usuwania
System.out.println(minHeap.poll()); // 1 — pobierz i usuń minimum
System.out.println(minHeap.poll()); // 2
System.out.println(minHeap.poll()); // 3
// Iteracja przez PriorityQueue NIE gwarantuje kolejności!

// Max-heap — odwrócony Comparator:
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
maxHeap.add(5);
maxHeap.add(1);
maxHeap.add(3);
maxHeap.poll(); // 5 — maksimum

// PriorityQueue z obiektami złożonymi:
record Task(String name, int priority) {}
PriorityQueue<Task> taskQueue = new PriorityQueue<>(
    Comparator.comparingInt(Task::priority) // najmniejszy priorytet = najpierw
);
taskQueue.add(new Task("Low task", 10));
taskQueue.add(new Task("High task", 1));
taskQueue.add(new Task("Med task", 5));
System.out.println(taskQueue.poll().name()); // "High task" — priority=1

// WAŻNE:
// offer(e) = add(e) — dla bounded queues offer zwraca false zamiast rzucać wyjątek
// peek() — zwraca null jeśli pusta (nie rzuca wyjątku)
// poll() — zwraca null jeśli pusta (nie rzuca wyjątku)
// element() — rzuca NoSuchElementException jeśli pusta (jak peek ale z wyjątkiem)
// remove() — rzuca NoSuchElementException jeśli pusta (jak poll ale z wyjątkiem)
```

---

## 12. Deque i ArrayDeque

### Pytanie 211 — podwójna kolejka

```java
// Deque — Double-Ended Queue (kolejka dwukierunkowa):
// Implementacje: ArrayDeque (ZAWSZE LEPSZA niż Stack i LinkedList dla kolejki)

Deque<String> deque = new ArrayDeque<>();

// Operacje na POCZĄTKU (front):
deque.addFirst("b");
deque.offerFirst("a");   // jak addFirst ale nie rzuca wyjątku dla bounded deques
String first = deque.peekFirst(); // "a" — podejrzyj bez usuwania
String removed = deque.pollFirst(); // "a" — usuń i zwróć

// Operacje na KOŃCU (back):
deque.addLast("c");
deque.offerLast("d");
String last = deque.peekLast(); // "d"
String removedLast = deque.pollLast(); // "d"

// Użycie jako STOS (Stack — LIFO):
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1); // = addFirst()
stack.push(2);
stack.push(3);
System.out.println(stack.pop());  // 3 — = removeFirst()
System.out.println(stack.peek()); // 2 — = peekFirst()

// Użycie jako KOLEJKA (Queue — FIFO):
Deque<Integer> queue = new ArrayDeque<>();
queue.offer(1);  // = addLast()
queue.offer(2);
queue.offer(3);
System.out.println(queue.poll()); // 1 — = removeFirst()

// Dlaczego ArrayDeque zamiast Stack i LinkedList?
// Stack — stary, synchronized (niepotrzebne narzuty)
// LinkedList — duże narzuty pamięciowe (węzły z referencjami)
// ArrayDeque — wydajna, tablicowa, bez synchronizacji
```

---

## 13. fail-fast vs fail-safe iterators

### Pytanie 212 — zachowanie iteratorów przy modyfikacji

```java
// FAIL-FAST — rzuca ConcurrentModificationException gdy kolekcja zmodyfikowana
// podczas iteracji (nawet z innego wątku):
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
Iterator<String> failFastIter = list.iterator();

list.add("d"); // modyfikacja po stworzeniu iteratora
try {
    failFastIter.next(); // ❌ ConcurrentModificationException!
} catch (ConcurrentModificationException e) {
    System.out.println("Fail-fast iterator detected modification");
}

// Mechanizm fail-fast: modCount — licznik modyfikacji kolekcji
// Iterator zapamiętuje expectedModCount = modCount przy tworzeniu
// Przy next()/remove() sprawdza: if (modCount != expectedModCount) throw CME

// Kolekcje fail-fast: ArrayList, LinkedList, HashMap, HashSet, TreeMap, TreeSet

// FAIL-SAFE — iteruje po kopii lub używa specjalnej struktury:
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ConcurrentHashMap;

// CopyOnWriteArrayList — przy modyfikacji tworzy kopię tablicy:
CopyOnWriteArrayList<String> cowList = new CopyOnWriteArrayList<>(List.of("a", "b", "c"));
Iterator<String> failSafeIter = cowList.iterator(); // kopia snapshot

cowList.add("d"); // modyfikuje oryginalną, iterator ma kopię
while (failSafeIter.hasNext()) {
    System.out.print(failSafeIter.next() + " "); // a b c — NIE widzi "d"
}
// Uwaga: Iterator NIE widzi zmian dokonanych po jego stworzeniu

// ConcurrentHashMap — fail-safe iterator (weakly consistent):
ConcurrentHashMap<String, Integer> concMap = new ConcurrentHashMap<>();
concMap.put("a", 1);
concMap.put("b", 2);
Iterator<String> concIter = concMap.keySet().iterator();
concMap.put("c", 3); // ✅ Nie rzuca CME — może ale nie musi iterować "c"
while (concIter.hasNext()) {
    System.out.print(concIter.next() + " "); // a b (może być c — weakly consistent)
}
```

---

## 14. HashMap — load factor i resize szczegółowo

### Pytanie 213 — optymalizacja HashMap

```java
// Kiedy ustalać initialCapacity:
// Jeśli wiesz ile elementów, optymalne: expectedSize / loadFactor + 1
// Dla 100 elementów: 100 / 0.75 + 1 ≈ 134 → zaokrąglone do potęgi 2: 128 lub 256

int expectedSize = 100;
HashMap<String, Integer> optimizedMap = new HashMap<>((int)(expectedSize / 0.75) + 1);

// Kiedy zmieniać loadFactor:
// Wyższy loadFactor (np. 0.9) — mniej pamięci, więcej kolizji, wolniejsze get/put
// Niższy loadFactor (np. 0.5) — więcej pamięci, mniej kolizji, szybsze get/put

// Java 8+ TreeNode optimization:
// Gdy kubełek ma > TREEIFY_THRESHOLD (8) węzłów → TreeNode (czerwono-czarne drzewo)
// Gdy TreeNode zmniejszy się do < UNTREEIFY_THRESHOLD (6) → z powrotem linked list
// Dlaczego? TreeNode: O(log n) vs linked list O(n) dla kolizji

// Ważne: HashMap jest NIE-thread-safe!
// Nawet operacje czytania mogą być problematyczne przy concurrent resize
// Użyj ConcurrentHashMap dla wielowątkowości

// HashMap z null:
HashMap<String, Integer> mapWithNull = new HashMap<>();
mapWithNull.put(null, 100);  // ✅ jeden null klucz!
mapWithNull.put("a", null);  // ✅ null wartości OK
System.out.println(mapWithNull.get(null)); // 100

// TreeMap z null — BŁĄD:
TreeMap<String, Integer> treeMap = new TreeMap<>();
// treeMap.put(null, 100); // ❌ NullPointerException — null nie może być porównany
```

---

## 15. Collections utility class

### Pytanie 214 — java.util.Collections

```java
// Najważniejsze metody:
List<Integer> list = new ArrayList<>(List.of(3, 1, 4, 1, 5, 9, 2, 6, 5, 3));

// Sortowanie:
Collections.sort(list);                                    // natural order
Collections.sort(list, Comparator.reverseOrder());        // reverse order

// Szukanie (lista MUSI być posortowana!):
Collections.sort(list);
int idx = Collections.binarySearch(list, 5);              // indeks lub -(insertion point) - 1

// Min/Max:
Integer min = Collections.min(list);  // 1
Integer max = Collections.max(list);  // 9

// Odwracanie, mieszanie:
Collections.reverse(list);  // odwróć kolejność
Collections.shuffle(list);  // wymieszaj losowo
Collections.shuffle(list, new java.util.Random(42)); // deterministyczne

// Wypełnianie i kopiowanie:
Collections.fill(list, 0);                              // wypełnij zerami
List<Integer> dest = new ArrayList<>(Collections.nCopies(list.size(), 0)); // kopia docelowa
Collections.copy(dest, list);                           // skopiuj list do dest

// Niemutowalne kolekcje:
List<Integer> unmod = Collections.unmodifiableList(list);
Set<Integer> unmodSet = Collections.unmodifiableSet(new HashSet<>(list));
Map<String, Integer> unmodMap = Collections.unmodifiableMap(new HashMap<>());

// Singleton:
List<String> singletonList = Collections.singletonList("one"); // lista jednoelementowa
Set<String> singletonSet = Collections.singleton("one");
Map<String, Integer> singletonMap = Collections.singletonMap("key", 1);

// Empty:
List<String> emptyList = Collections.emptyList();
Set<Integer> emptySet = Collections.emptySet();
Map<String, Integer> emptyMap = Collections.emptyMap();

// Rotacja:
List<Integer> rotated = new ArrayList<>(List.of(1, 2, 3, 4, 5));
Collections.rotate(rotated, 2); // [4, 5, 1, 2, 3] — przesuń o 2 w prawo

// Zamiana par:
Collections.swap(rotated, 0, 4); // zamień elementy na indeksach 0 i 4

// Disjoint — czy dwie kolekcje nie mają wspólnych elementów:
boolean noCommon = Collections.disjoint(List.of(1, 2, 3), List.of(4, 5, 6)); // true

// Frequency:
int count = Collections.frequency(list, 5); // ile razy 5 w liście
```

---

## 16. Porównanie implementacji Map — szczegółowa tabela

### Pytanie 215 — wybór implementacji Map

| Cecha | HashMap | LinkedHashMap | TreeMap | ConcurrentHashMap |
|---|---|---|---|---|
| Kolejność | Brak | Insertion/Access | Posortowana | Brak |
| Złożoność get/put | O(1) | O(1) | O(log n) | O(1) |
| Null klucz | ✅ 1 null | ✅ 1 null | ❌ NPE | ❌ NPE |
| Null wartość | ✅ | ✅ | ✅ | ❌ NPE |
| Thread-safe | ❌ | ❌ | ❌ | ✅ |
| Implementacja | Tablica + listy/drzewa | LinkedHashMap | Red-Black Tree | Segmented locks/CAS |

---

## 17. Queue i Deque — metody i wyjątki

### Pytanie 216 — API kolejki szczegółowo

```java
// Queue interface — dwie formy każdej operacji:
// Rzuca wyjątek | Zwraca null/false
// ─────────────┼───────────────────
// add(e)       │ offer(e)
// remove()     │ poll()
// element()    │ peek()

Queue<String> queue = new LinkedList<>(); // lub ArrayDeque

// Metody rzucające wyjątek:
queue.add("a");          // dodaj lub IllegalStateException
String first = queue.element(); // podejrzyj lub NoSuchElementException
String removed = queue.remove(); // usuń lub NoSuchElementException

// Metody bezpieczne:
queue.offer("b");           // dodaj lub false (dla bounded queue)
String peeked = queue.peek(); // podejrzyj lub null
String polled = queue.poll(); // usuń lub null

// Deque interface — metody:
Deque<String> deque = new ArrayDeque<>();
// Operacje "First":   addFirst/offerFirst, removeFirst/pollFirst, getFirst/peekFirst
// Operacje "Last":    addLast/offerLast, removeLast/pollLast, getLast/peekLast
// Operacje Stack:     push(=addFirst), pop(=removeFirst), peek(=peekFirst)
// Operacje Queue:     add(=addLast), offer(=offerLast), poll(=pollFirst), peek(=peekFirst)
```

---

## 18. Arrays i Collections — metody pomocnicze

### Pytanie 217 — java.util.Arrays

```java
// Arrays — klasa narzędziowa dla tablic:
int[] arr = {3, 1, 4, 1, 5, 9, 2, 6};

// Sortowanie:
Arrays.sort(arr);                                    // modyfikuje tablicę!
Arrays.sort(arr, 2, 6);                             // sort pod-tablicy [2,6)
String[] strArr = {"b", "a", "c"};
Arrays.sort(strArr, Comparator.reverseOrder());      // z Comparatorem

// Szukanie (musi być posortowane):
Arrays.sort(arr);
int idx = Arrays.binarySearch(arr, 5);               // indeks 5 lub -(idx+1)

// Kopiowanie:
int[] copy = Arrays.copyOf(arr, 5);                  // pierwsze 5 elementów
int[] rangeCopy = Arrays.copyOfRange(arr, 2, 6);     // [2,6)

// Wypełnianie:
int[] filled = new int[10];
Arrays.fill(filled, 42);                             // [42, 42, 42, ...]

// Porównanie:
int[] a = {1, 2, 3};
int[] b = {1, 2, 3};
System.out.println(Arrays.equals(a, b));             // true (element-wise)
System.out.println(a.equals(b));                     // false (reference equality!)

// Konwersja tablica → List:
String[] strArray = {"a", "b", "c"};
List<String> listFromArray = Arrays.asList(strArray); // UWAGA: fixed-size!
// listFromArray.add("d"); // ❌ UnsupportedOperationException!
// listFromArray.set(0, "x"); // ✅ OK — możemy zamieniać elementy

// Lepsza konwersja:
List<String> mutableList = new ArrayList<>(Arrays.asList(strArray)); // mutable!
List<String> immutableList = List.of(strArray); // Java 9+ immutable

// toString dla wielowymiarowych tablic:
int[][] matrix = {{1, 2}, {3, 4}};
System.out.println(Arrays.toString(matrix));         // [[I@...] — złe!
System.out.println(Arrays.deepToString(matrix));     // [[1, 2], [3, 4]] — ✅
```

---

## 19. Hierarchia kolekcji — szczegółowe operacje

### Pytanie 218 — operacje na Set i relacje zbiorów

```java
// Operacje zbiorowe:
Set<Integer> setA = new HashSet<>(Set.of(1, 2, 3, 4, 5));
Set<Integer> setB = new HashSet<>(Set.of(3, 4, 5, 6, 7));

// Suma (union) — wszystkie elementy z A i B:
Set<Integer> union = new HashSet<>(setA);
union.addAll(setB);             // {1, 2, 3, 4, 5, 6, 7}

// Przecięcie (intersection) — tylko wspólne:
Set<Integer> intersection = new HashSet<>(setA);
intersection.retainAll(setB);   // {3, 4, 5}

// Różnica (difference) — w A ale nie w B:
Set<Integer> difference = new HashSet<>(setA);
difference.removeAll(setB);     // {1, 2}

// Różnica symetryczna — w A lub B ale nie w obu:
Set<Integer> symDiff = new HashSet<>(union);
symDiff.removeAll(intersection); // {1, 2, 6, 7}

// Sprawdzenie podzbioru:
setB.containsAll(Set.of(3, 4)); // true — {3,4} jest podzbiorem setB
```

---

## 20. Podsumowanie — wybór kolekcji

### Pytanie 219 — algorytm wyboru odpowiedniej kolekcji

```java
// DRZEWO DECYZYJNE dla wyboru kolekcji:

// Potrzebujesz pary klucz-wartość?
//   TAK → Map:
//     Porządek nieważny, szybkość → HashMap
//     Chcesz insertion order → LinkedHashMap
//     Chcesz posortowane klucze → TreeMap
//     Wielowątkowość → ConcurrentHashMap
//
//   NIE → Kolekcja elementów:
//     Duplikaty OK?
//       TAK → List:
//         Losowy dostęp przez indeks → ArrayList
//         Dużo wstawiania/usuwania z końców → ArrayDeque
//         (LinkedList rzadko jest najlepszym wyborem)
//
//       NIE → Set:
//         Porządek nieważny, szybkość → HashSet
//         Chcesz insertion order → LinkedHashSet
//         Chcesz posortowane → TreeSet
//
//     Specjalna kolejność?
//       FIFO (kolejka) → ArrayDeque (jako Queue)
//       LIFO (stos) → ArrayDeque (jako Stack)
//       Min/Max (priorytet) → PriorityQueue
//       Obie strony → ArrayDeque (Deque)

// ZŁOŻONOŚĆ OPERACJI — podsumowanie:
// ┌──────────────┬───────┬────────────┬─────────────┬───────────┐
// │ Kolekcja     │ add   │ remove     │ get(i)/find │ contains  │
// ├──────────────┼───────┼────────────┼─────────────┼───────────┤
// │ ArrayList    │ O(1)* │ O(n)       │ O(1)        │ O(n)      │
// │ LinkedList   │ O(1)  │ O(1) ends  │ O(n)        │ O(n)      │
// │ ArrayDeque   │ O(1)* │ O(1) ends  │ O(n)        │ O(n)      │
// │ HashSet      │ O(1)  │ O(1)       │ N/A         │ O(1)      │
// │ TreeSet      │O(lgn) │ O(log n)   │ N/A         │ O(log n)  │
// │ PriorityQueue│ O(lgn)│ O(log n)   │ N/A         │ O(n)      │
// │ HashMap      │ O(1)  │ O(1)       │ O(1)        │ O(1) keys │
// │ TreeMap      │O(lgn) │ O(log n)   │ O(log n)    │ O(log n)  │
// └──────────────┴───────┴────────────┴─────────────┴───────────┘
// * amortyzowane (z okazjonalnym resize O(n))
```

**Kluczowe zasady do zapamiętania:**

1. `equals()` i `hashCode()` muszą być spójne — kolekcje haszujące na tym polegają.
2. Klucze w TreeMap/TreeSet muszą być `Comparable` lub dostarcz `Comparator`.
3. `List.of()` nie pozwala na `null`, jest prawdziwie niemutowalna (nie widok).
4. `ConcurrentModificationException` — używaj `Iterator.remove()` lub `removeIf()`.
5. `ArrayDeque` jest lepszy niż `Stack` i `LinkedList` dla stosu/kolejki.
6. `LinkedHashMap` z `accessOrder=true` = LRU Cache.
7. Nie używaj `ordinal()` do logiki — dotyczy też `EnumMap`/`EnumSet`.
