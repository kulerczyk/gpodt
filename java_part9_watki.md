# Przewodnik egzaminacyjny Java — Część 9: Wielowątkowość i Synchronizacja
## (pytania 260–299)

---

## 1. Thread vs Runnable vs Callable

### Pytanie 260 — trzy sposoby tworzenia wątków

```java
// SPOSÓB 1: Rozszerzenie klasy Thread (niezalecane — zajmuje jedną "kartę dziedziczenia"):
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Running in: " + Thread.currentThread().getName());
    }
}
new MyThread().start(); // WAŻNE: start(), nie run()!
// run() wywołuje metodę synchronicznie — bez nowego wątku!

// SPOSÓB 2: Implementacja Runnable (preferowane — kompozycja > dziedziczenie):
class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("Runnable in: " + Thread.currentThread().getName());
    }
}
Thread thread = new Thread(new MyRunnable());
thread.start();

// Z lambdą (Runnable jest @FunctionalInterface):
Thread lambdaThread = new Thread(() -> System.out.println("Lambda thread!"));
lambdaThread.start();

// SPOSÓB 3: Callable<V> — zwraca wartość i może rzucać wyjątki:
import java.util.concurrent.*;

Callable<Integer> task = () -> {
    Thread.sleep(1000); // może rzucić InterruptedException (checked!)
    return 42;
};

ExecutorService executor = Executors.newSingleThreadExecutor();
Future<Integer> future = executor.submit(task);
Integer result = future.get(); // blokuje, czeka na wynik
System.out.println(result); // 42
executor.shutdown();

// PORÓWNANIE:
// ┌──────────────┬────────────────┬─────────────────┬──────────────────┐
// │ Aspekt       │ Thread extends │ Runnable        │ Callable<V>      │
// ├──────────────┼────────────────┼─────────────────┼──────────────────┤
// │ Wynik        │ brak           │ brak            │ V (Future<V>)    │
// │ Wyjątki      │ unchecked      │ unchecked       │ checked też OK   │
// │ Dziedziczenie│ blokuje        │ nie blokuje     │ nie blokuje      │
// │ ExecutorSvc  │ nie            │ submit/execute  │ submit           │
// └──────────────┴────────────────┴─────────────────┴──────────────────┘
```

---

## 2. Cykl życia wątku

### Pytanie 261 — stany wątku w Javie

```java
// Stany wątku (Thread.State):
// NEW → RUNNABLE → BLOCKED/WAITING/TIMED_WAITING → TERMINATED

// NEW — wątek stworzony, nie uruchomiony:
Thread t = new Thread(() -> System.out.println("Hello"));
System.out.println(t.getState()); // NEW

// RUNNABLE — wątek uruchomiony (działa LUB czeka na CPU):
t.start();
// t.getState() = RUNNABLE (może działać lub być w kolejce planisty OS)

// BLOCKED — oczekiwanie na monitor (wejście do synchronized):
// Wątek A trzyma synchronized(obj), Wątek B próbuje wejść → B jest BLOCKED

// WAITING — oczekiwanie bez limitu czasu:
// Object.wait() — czeka na notify()
// Thread.join() — czeka aż inny wątek zakończy
// LockSupport.park()

// TIMED_WAITING — oczekiwanie z limitem czasu:
// Thread.sleep(ms)
// Object.wait(timeout)
// Thread.join(timeout)
// LockSupport.parkNanos()

// TERMINATED — wątek zakończył działanie (run() powrócił lub wyjątek):
// Zakończonego wątku NIE MOŻNA ponownie uruchomić!

// Przykład demonstracyjny:
Thread worker = new Thread(() -> {
    try {
        Thread.sleep(2000); // TIMED_WAITING
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt(); // przywróć flagę przerwania!
    }
});
System.out.println(worker.getState()); // NEW
worker.start();
Thread.sleep(100);
System.out.println(worker.getState()); // TIMED_WAITING
Thread.sleep(2500);
System.out.println(worker.getState()); // TERMINATED
```

---

## 3. synchronized — metody, bloki, monitor

### Pytanie 262 — mechanizm synchronizacji

```java
// synchronized na metodzie instancyjnej — monitor to THIS:
class Counter {
    private int count = 0;

    public synchronized void increment() {
        count++; // atomicznie — jeden wątek na raz
    }

    public synchronized int getCount() {
        return count;
    }
}

// Ekwiwalent z synchronized blokiem:
class Counter2 {
    private int count = 0;
    private final Object lock = new Object(); // explicit lock object

    public void increment() {
        synchronized (this) { // lub synchronized (lock) — bardziej enkapsulowany
            count++;
        }
    }

    public int getCount() {
        synchronized (this) {
            return count;
        }
    }
}

// synchronized na metodzie statycznej — monitor to CLASS OBJECT:
class StaticCounter {
    private static int count = 0;

    public static synchronized void increment() {
        count++; // monitor = StaticCounter.class
    }
}

// Dobra praktyka — prywatny obiekt lock:
class BankAccount {
    private double balance;
    private final Object balanceLock = new Object(); // prywatny, hermetyczny lock

    public void deposit(double amount) {
        synchronized (balanceLock) { // zewnętrzny kod nie może na nim blokować
            balance += amount;
        }
    }

    public void withdraw(double amount) {
        synchronized (balanceLock) {
            if (balance >= amount) {
                balance -= amount;
            } else {
                throw new IllegalStateException("Insufficient funds");
            }
        }
    }
}

// WAŻNE — granularność blokad:
// synchronized(this) — blokuje CAŁY obiekt → mniejsza współbieżność
// synchronized(lock) — blokuje konkretny zasób → większa współbieżność
```

---

## 4. volatile — widoczność i brak atomowości

### Pytanie 263 — volatile — co gwarantuje, czego nie gwarantuje

```java
// volatile gwarantuje:
// 1. WIDOCZNOŚĆ — zapisane przez jeden wątek jest od razu widoczne dla innych
// 2. Brak reorderingu dla operacji volatile (happens-before)
// 3. NIE gwarantuje atomowości złożonych operacji!

class VolatileExample {
    private volatile boolean stop = false;
    private volatile int count = 0; // każdy odczyt/zapis to atomic, ale count++ nie!

    // Poprawne użycie volatile — flaga stopu:
    public void run() {
        while (!stop) { // odczyt volatile — widzi aktualizacje z innych wątków
            doWork();
        }
    }

    public void requestStop() {
        stop = true; // zapis volatile — natychmiast widoczny dla run()
    }

    // ❌ NIEBEZPIECZNE — count++ nie jest atomowe nawet z volatile!
    public void incrementBad() {
        count++; // to są 3 operacje: read, increment, write → race condition!
    }
}

// count++ rozłożone na operacje (nie atomowe!):
// 1. temp = count (odczyt)
// 2. temp = temp + 1 (obliczenie)
// 3. count = temp (zapis)
// Dwa wątki mogą jednocześnie przeczytać count=0, oba obliczyć 1, oba zapisać 1
// Wynik: 1 zamiast 2 — race condition!

// Dla atomowych operacji użyj AtomicInteger:
import java.util.concurrent.atomic.AtomicInteger;
AtomicInteger atomicCount = new AtomicInteger(0);
atomicCount.incrementAndGet(); // atomowe!

// Kiedy volatile wystarcza:
// ✅ Prosta flaga (boolean volatile stop)
// ✅ Singleton lazy init z double-checked locking:
class Singleton {
    private static volatile Singleton instance; // MUSI być volatile!

    public static Singleton getInstance() {
        if (instance == null) {                 // pierwsze sprawdzenie (bez locka)
            synchronized (Singleton.class) {
                if (instance == null) {         // drugie sprawdzenie (z lockiem)
                    instance = new Singleton(); // volatile zapobiega częściowej widoczności
                }
            }
        }
        return instance;
    }
}
```

---

## 5. wait(), notify(), notifyAll()

### Pytanie 264 — mechanizm komunikacji między wątkami

```java
// wait(), notify(), notifyAll() — MUSZĄ być wywoływane wewnątrz synchronized!
// Muszą być wywoływane na obiekcie będącym monitorem.

class ProducerConsumer {
    private final Queue<Integer> queue = new LinkedList<>();
    private final int CAPACITY = 5;
    private final Object lock = new Object();

    // PRODUCENT:
    public void produce(int value) throws InterruptedException {
        synchronized (lock) {
            while (queue.size() == CAPACITY) { // WHILE nie IF! (spurious wakeups)
                lock.wait(); // zwalnia monitor i czeka na notify
            }
            queue.add(value);
            System.out.println("Produced: " + value);
            lock.notifyAll(); // obudź WSZYSTKICH czekających
        }
    }

    // KONSUMENT:
    public int consume() throws InterruptedException {
        synchronized (lock) {
            while (queue.isEmpty()) { // WHILE nie IF!
                lock.wait(); // czeka aż producent doda element
            }
            int value = queue.poll();
            System.out.println("Consumed: " + value);
            lock.notifyAll(); // obudź producentów
            return value;
        }
    }
}

// DLACZEGO while zamiast if?
// Spurious wakeups — JVM może obudzić wątek bez notify!
// Po obudzeniu zawsze sprawdź warunek ponownie!
// if: po obudzeniu zakłada, że warunek jest spełniony — może być błąd
// while: po obudzeniu sprawdza warunek i wraca do czekania jeśli nie spełniony

// notify() vs notifyAll():
// notify() — budzi JEDEN wątek (który — nieokreślone)
// notifyAll() — budzi WSZYSTKIE czekające wątki (same sprawdzają warunek)
// Bezpieczniej używać notifyAll() — notify() może prowadzić do starvation

// Wyjątki:
// wait() rzuca InterruptedException (checked!) — zawsze obsłuż!
// Typowy wzorzec:
try {
    while (!condition) {
        lock.wait();
    }
} catch (InterruptedException e) {
    Thread.currentThread().interrupt(); // PRZYWRÓĆ flagę przerwania!
    throw new RuntimeException(e);
}
```

---

## 6. Deadlock — warunki i unikanie

### Pytanie 265 — warunki zakleszczenia (Coffman)

Deadlock to sytuacja gdy dwa (lub więcej) wątki wzajemnie czekają na zasoby, które drugi trzyma:

```java
// Klasyczny deadlock:
final Object lock1 = new Object();
final Object lock2 = new Object();

// Wątek A — bierze lock1, potem lock2:
Thread threadA = new Thread(() -> {
    synchronized (lock1) {
        System.out.println("Thread A: holding lock1...");
        try { Thread.sleep(100); } catch (InterruptedException e) {}
        synchronized (lock2) {  // CZEKA — Thread B trzyma lock2!
            System.out.println("Thread A: holding lock1 and lock2");
        }
    }
});

// Wątek B — bierze lock2, potem lock1:
Thread threadB = new Thread(() -> {
    synchronized (lock2) {
        System.out.println("Thread B: holding lock2...");
        try { Thread.sleep(100); } catch (InterruptedException e) {}
        synchronized (lock1) {  // CZEKA — Thread A trzyma lock1!
            System.out.println("Thread B: holding lock1 and lock2");
        }
    }
});

// WARUNKI COFFMANA — deadlock gdy WSZYSTKIE 4 spełnione:
// 1. Mutual Exclusion — zasób trzymany przez co najwyżej jeden wątek
// 2. Hold and Wait — wątek trzyma zasób i czeka na kolejny
// 3. No Preemption — zasób nie może być odebrany siłą
// 4. Circular Wait — cykl w grafie oczekiwania (A czeka na B, B czeka na A)

// JAK UNIKAĆ DEADLOCKU:
// 1. Ustal globalny porządek blokad (lock ordering):
int id1 = System.identityHashCode(lock1);
int id2 = System.identityHashCode(lock2);
Object first = id1 < id2 ? lock1 : lock2;   // zawsze bierz "mniejszy" lock pierwszy
Object second = id1 < id2 ? lock2 : lock1;  // ZAWSZE taka sama kolejność

synchronized (first) {
    synchronized (second) {
        // bezpieczne!
    }
}

// 2. Użyj tryLock() z timeoutem (ReentrantLock):
ReentrantLock rl1 = new ReentrantLock();
ReentrantLock rl2 = new ReentrantLock();

if (rl1.tryLock(100, TimeUnit.MILLISECONDS)) {
    try {
        if (rl2.tryLock(100, TimeUnit.MILLISECONDS)) {
            try {
                // oba locki zdobyte
            } finally { rl2.unlock(); }
        }
    } finally { rl1.unlock(); }
}

// 3. Unikaj trzymania wielu locków jednocześnie
// 4. Używaj wyższego poziomu abstrakcji (java.util.concurrent)
```

---

## 7. ReentrantLock vs synchronized

### Pytanie 266 — ReentrantLock — zaawansowana synchronizacja

```java
import java.util.concurrent.locks.*;

// ReentrantLock — bardziej elastyczny niż synchronized:
ReentrantLock lock = new ReentrantLock();

// Podstawowe użycie:
lock.lock();
try {
    // sekcja krytyczna
} finally {
    lock.unlock(); // ZAWSZE w finally!
}

// tryLock() — nie blokuje jeśli lock niedostępny:
if (lock.tryLock()) {
    try {
        // sekcja krytyczna
    } finally {
        lock.unlock();
    }
} else {
    // lock niedostępny — zrób coś innego lub spróbuj później
}

// tryLock(timeout) — czeka przez określony czas:
if (lock.tryLock(500, TimeUnit.MILLISECONDS)) {
    try { /* ... */ } finally { lock.unlock(); }
}

// Reentrant — ten sam wątek może wejść wielokrotnie:
lock.lock(); // 1
lock.lock(); // 2 — ten sam wątek, OK! (zlicza hold count)
lock.unlock(); // hold count = 1
lock.unlock(); // hold count = 0, lock zwolniony

// Warunki (Conditions) — jak wait/notify ale elastyczniejsze:
Condition notFull = lock.newCondition();
Condition notEmpty = lock.newCondition();

// Producent:
lock.lock();
try {
    while (queue.size() == CAPACITY) notFull.await(); // czeka na "not full"
    queue.add(item);
    notEmpty.signal(); // sygnalizuje konsumentom
} finally { lock.unlock(); }

// Konsument:
lock.lock();
try {
    while (queue.isEmpty()) notEmpty.await(); // czeka na "not empty"
    int item = queue.poll();
    notFull.signal(); // sygnalizuje producentom
} finally { lock.unlock(); }

// Fair lock — gwarantuje kolejkę FIFO dla oczekujących wątków:
ReentrantLock fairLock = new ReentrantLock(true); // true = fair

// PORÓWNANIE synchronized vs ReentrantLock:
// synchronized:
// ✅ Prostszy, mniej kodu
// ✅ Automatyczne zwalnianie (JVM)
// ❌ Brak tryLock(), timeout
// ❌ Jeden Condition na monitor
// ❌ Zawsze unfair (nie-kolejkowy)
// ReentrantLock:
// ✅ tryLock() z timeoutem
// ✅ Wiele Condition per lock
// ✅ Fair/unfair do wyboru
// ✅ lockInterruptibly()
// ❌ Ręczne unlock() w finally
```

---

## 8. Atomic Classes — CAS Operations

### Pytanie 267 — klasy atomowe

```java
import java.util.concurrent.atomic.*;

// AtomicInteger — atomowe operacje na int:
AtomicInteger counter = new AtomicInteger(0);

counter.incrementAndGet();   // ++counter (atomowe)
counter.getAndIncrement();   // counter++ (atomowe)
counter.addAndGet(5);        // counter += 5 (atomowe)
counter.getAndAdd(5);        // counter += 5, zwraca starą wartość

counter.set(100);            // setter
int value = counter.get();   // getter
counter.compareAndSet(100, 200); // atomowe CAS: if(val==100) val=200

// CAS — Compare-And-Swap (fundamentalny mechanizm):
// Atomowa operacja sprzętowa: if (current == expected) { current = newValue; return true; }
//                              else { return false; }

// compareAndExchange (Java 9+):
int witness = counter.compareAndExchange(200, 300); // zwraca faktyczną wartość

// AtomicLong, AtomicBoolean — analogiczne

// AtomicReference<V> — dla obiektów:
AtomicReference<String> ref = new AtomicReference<>("initial");
ref.set("updated");
ref.compareAndSet("updated", "final"); // CAS na obiekcie (identity ==)

// AtomicIntegerArray/AtomicLongArray — tablice z atomowymi operacjami:
AtomicIntegerArray arr = new AtomicIntegerArray(10);
arr.incrementAndGet(5); // atomowy increment elementu [5]

// LongAdder/LongAccumulator (Java 8+) — wydajniejsze dla wysokiej współbieżności:
LongAdder adder = new LongAdder();
adder.increment();  // szybsze niż AtomicLong.incrementAndGet() przy wielu wątkach
adder.add(5);
long sum = adder.sum(); // podsumowuje wartości z różnych wątków

// LongAdder vs AtomicLong:
// AtomicLong: jeden counter → wiele wątków "bije się" o jeden CAS
// LongAdder: wiele counter per wątek → brak konfliktu, sumowanie na koniec
// LongAdder lepszy gdy: wysoka współbieżność, write >> read

// VarHandle (Java 9+) — niskopoziomowe operacje na polach:
// Nowoczesna alternatywa dla Unsafe i AtomicFieldUpdater
```

---

## 9. ExecutorService i ThreadPool

### Pytanie 268 — pule wątków

```java
import java.util.concurrent.*;

// Typy pul wątków przez Executors:

// 1. FixedThreadPool — stała liczba wątków:
ExecutorService fixed = Executors.newFixedThreadPool(4);
// ✅ Ogranicza zasoby, stabilna wydajność
// Używaj gdy znasz optymalne obciążenie

// 2. CachedThreadPool — dynamiczna liczba wątków:
ExecutorService cached = Executors.newCachedThreadPool();
// Wątki tworzone na żądanie, nieużywane usuwane po 60s
// ❌ RYZYKO — może stworzyć nieograniczoną liczbę wątków przy przeciążeniu!
// Używaj tylko dla krótkich zadań, niskiego obciążenia

// 3. SingleThreadExecutor — jeden wątek:
ExecutorService single = Executors.newSingleThreadExecutor();
// Gwarantuje sekwencyjne wykonanie zadań FIFO

// 4. ScheduledThreadPool — ze schedulingiem:
ScheduledExecutorService scheduled = Executors.newScheduledThreadPool(2);
scheduled.schedule(() -> System.out.println("After 5s"), 5, TimeUnit.SECONDS);
scheduled.scheduleAtFixedRate(() -> System.out.println("Every 1s"), 0, 1, TimeUnit.SECONDS);
scheduled.scheduleWithFixedDelay(() -> System.out.println("1s after done"), 0, 1, TimeUnit.SECONDS);

// 5. WorkStealingPool (Java 8+) — ForkJoin-based:
ExecutorService workStealing = Executors.newWorkStealingPool(); // CPU-count wątków
// Dobry dla compute-intensive zadań z podziałem (fork/join)

// Poprawne zamknięcie:
fixed.shutdown();     // zakończ po wykonaniu czekających zadań
fixed.shutdownNow();  // przerwij wszystko i zwróć listę oczekujących
boolean terminated = fixed.awaitTermination(10, TimeUnit.SECONDS); // czekaj na zamknięcie

// ThreadPoolExecutor — pełna kontrola:
ExecutorService custom = new ThreadPoolExecutor(
    2,                            // corePoolSize — minimalna liczba wątków
    10,                           // maximumPoolSize — maksymalna liczba
    60L, TimeUnit.SECONDS,        // keepAliveTime — czas idle przed usunięciem
    new ArrayBlockingQueue<>(100), // workQueue — kolejka zadań oczekujących
    new ThreadFactory() {          // threadFactory — jak tworzyć wątki
        int count = 0;
        @Override
        public Thread newThread(Runnable r) {
            Thread t = new Thread(r, "custom-worker-" + count++);
            t.setDaemon(true); // daemon thread
            return t;
        }
    },
    new ThreadPoolExecutor.CallerRunsPolicy() // rejectedExecution handler
    // Polityki odrzucania: AbortPolicy (default, rzuca), CallerRunsPolicy,
    //                      DiscardPolicy, DiscardOldestPolicy
);
```

---

## 10. Future i CompletableFuture

### Pytanie 269 — asynchroniczne programowanie

```java
import java.util.concurrent.*;

// Future<V> — wynik asynchronicznego obliczenia:
ExecutorService executor = Executors.newFixedThreadPool(4);

Future<Integer> future = executor.submit(() -> {
    Thread.sleep(2000); // długie obliczenie
    return 42;
});

// Sprawdzenie stanu:
System.out.println(future.isDone());     // false (jeśli jeszcze trwa)
System.out.println(future.isCancelled()); // false

// Czekanie na wynik (blokujące!):
try {
    Integer result = future.get();                           // blokuje bez limitu
    Integer resultTimeout = future.get(3, TimeUnit.SECONDS); // limit 3 sekundy
} catch (ExecutionException e) {
    // wyjątek z Callable
} catch (TimeoutException e) {
    future.cancel(true); // anuluj + przerwij jeśli możliwe
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
}

// CompletableFuture<V> (Java 8+) — composable async:
import java.util.concurrent.CompletableFuture;

// Tworzenie:
CompletableFuture<String> cf1 = CompletableFuture.supplyAsync(() -> {
    // uruchomione w ForkJoinPool.commonPool() (lub własnym Executor)
    return fetchFromDatabase();
});

CompletableFuture<Void> cf2 = CompletableFuture.runAsync(() -> {
    doBackgroundWork(); // brak wyniku
});

// Łańcuchowanie:
CompletableFuture<String> pipeline = CompletableFuture
    .supplyAsync(() -> "Hello")           // async start
    .thenApply(s -> s + " World")         // transform (synchronicznie)
    .thenApplyAsync(s -> s.toUpperCase()) // transform (asynchronicznie)
    .thenCombine(
        CompletableFuture.supplyAsync(() -> "!"), // połącz z innym CF
        (a, b) -> a + b
    );

// Konsumpcja wyniku:
pipeline.thenAccept(System.out::println);  // efekt uboczny, brak wyniku
pipeline.thenRun(() -> System.out.println("Done")); // bez dostępu do wartości

// Obsługa błędów:
CompletableFuture<String> safe = cf1
    .exceptionally(ex -> "Fallback: " + ex.getMessage()) // obsługa wyjątku
    .handle((result, ex) -> ex != null ? "Error: " + ex.getMessage() : result); // oba przypadki

// Oczekiwanie na wiele:
CompletableFuture<Void> allDone = CompletableFuture.allOf(cf1, cf2); // wszystkie
CompletableFuture<Object> anyDone = CompletableFuture.anyOf(cf1, cf2); // pierwszy

// Pobieranie wyniku:
String result = pipeline.get();             // blokujące
String orDefault = pipeline.getNow("none"); // nie blokuje, zwraca default jeśli niegotowe
String join = pipeline.join();              // blokujące, rzuca unchecked zamiast checked
```

---

## 11. CountDownLatch, CyclicBarrier, Semaphore, Phaser

### Pytanie 270 — narzędzia synchronizacji

```java
import java.util.concurrent.*;

// CountDownLatch — jednorazowe oczekiwanie:
int N_WORKERS = 5;
CountDownLatch startSignal = new CountDownLatch(1); // wszyscy czekają na 1
CountDownLatch doneSignal = new CountDownLatch(N_WORKERS); // czekamy na N

for (int i = 0; i < N_WORKERS; i++) {
    new Thread(() -> {
        try {
            startSignal.await(); // czekaj na sygnał startu
            doWork();
            doneSignal.countDown(); // sygnalizuj ukończenie
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }).start();
}

startSignal.countDown(); // odpal wszystkich naraz!
doneSignal.await();       // czekaj aż wszyscy skończą
System.out.println("All workers done!");
// ❌ CountDownLatch NIE może być zresetowane — jednorazowe!

// CyclicBarrier — wielokrotna bariera:
CyclicBarrier barrier = new CyclicBarrier(3, () -> {
    System.out.println("Barrier passed! All 3 threads reached barrier"); // akcja gdy wszyscy czekają
});

Runnable worker = () -> {
    try {
        doPhase1();
        barrier.await();  // czekaj na pozostałych 2 wątki
        doPhase2();
        barrier.await();  // PONOWNE użycie! (Cyclic)
    } catch (BrokenBarrierException | InterruptedException e) { }
};
// CyclicBarrier resetuje się automatycznie po przejściu

// Semaphore — limitowanie dostępu:
Semaphore sem = new Semaphore(3, true); // 3 pozwolenia, fair=true

// Thread acquire/release:
sem.acquire();    // weź pozwolenie (blokuje jeśli 0 dostępnych)
try {
    // sekcja z ograniczonym dostępem (max 3 wątki jednocześnie)
} finally {
    sem.release(); // zwróć pozwolenie
}

// Semaphore jako mutex (binary semaphore):
Semaphore mutex = new Semaphore(1); // tylko 1 wątek na raz

// Phaser (Java 7+) — elastyczna bariera:
Phaser phaser = new Phaser(1); // 1 = main thread

for (int i = 0; i < 3; i++) {
    phaser.register(); // dynamicznie rejestruj wątki
    new Thread(() -> {
        phaser.arriveAndAwaitAdvance(); // dojdź do bariery i poczekaj na resztę
        doWork();
        phaser.arriveAndDeregister();   // wyrejestruj po zakończeniu
    }).start();
}
phaser.arriveAndAwaitAdvance(); // main thread też czeka
// Phaser: dynamiczna rejestracja wątków, numerowane fazy
```

---

## 12. Java Memory Model — Happens-Before

### Pytanie 271 — model pamięci Javy

**Happens-before** to relacja gwarantująca że efekty jednej operacji są widoczne dla innej:

```java
// ZASADY HAPPENS-BEFORE:
// 1. Program order — każda akcja w wątku HB następną akcję w tym samym wątku
// 2. Monitor lock — unlock HB następny lock na tym samym monitorze
// 3. Volatile — zapis volatile HB odczyt tej samej zmiennej volatile
// 4. Thread start — t.start() HB wszystkie akcje w wątku t
// 5. Thread join — wszystkie akcje w t HB powrót t.join()
// 6. Transitivity — jeśli A HB B i B HB C, to A HB C

// Problem bez happens-before:
class NoVisibility {
    private static boolean ready = false;
    private static int number = 0;

    private static class ReaderThread extends Thread {
        @Override
        public void run() {
            while (!ready) { Thread.yield(); }
            System.out.println(number); // może wypisać 0 zamiast 42!
        }
    }

    public static void main(String[] args) throws InterruptedException {
        new ReaderThread().start();
        number = 42;
        ready = true;
        // Kompilator/JVM może przeorganizować operacje!
        // Reader może zobaczyć ready=true ale number=0 (reordering)
    }
}

// Rozwiązanie z volatile:
class WithVisibility {
    private static volatile boolean ready = false; // HB między wątkami
    private static int number = 0;

    private static class ReaderThread extends Thread {
        @Override
        public void run() {
            while (!ready) { Thread.yield(); }
            System.out.println(number); // ✅ zawsze widzi 42
        }
    }
    // volatile ready: zapis (ready=true) HB odczyt (while(!ready) wychodzi)
    // WSZYSTKO przed zapisem volatile jest widoczne po odczycie volatile!
}

// Dlaczego powyższe działa?
// Zapis number=42 HB zapis ready=true (program order)
// Zapis ready=true HB odczyt ready=true (volatile)
// Odczyt ready=true HB odczyt number (program order)
// Transitivity: zapis number=42 HB odczyt number!
```

---

## 13. ThreadLocal

### Pytanie 272 — zmienne lokalne dla wątku

```java
import java.text.SimpleDateFormat;

// ThreadLocal<T> — każdy wątek ma własną kopię zmiennej:
ThreadLocal<Integer> threadLocalId = ThreadLocal.withInitial(() -> 0);
ThreadLocal<SimpleDateFormat> dateFormat = 
    ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

// Przykład — user context per request (web):
class UserContext {
    private static final ThreadLocal<User> currentUser = new ThreadLocal<>();

    public static void setUser(User user) {
        currentUser.set(user);
    }

    public static User getUser() {
        return currentUser.get();
    }

    public static void clear() {
        currentUser.remove(); // ✅ WAŻNE — zwolnij po zakończeniu żądania!
    }
}

// Typowy wzorzec w web frameworku:
class RequestFilter {
    void handleRequest(HttpRequest request, HttpResponse response) {
        try {
            User user = authenticate(request);
            UserContext.setUser(user); // ustaw dla tego wątku
            processRequest(request, response); // w tym i zagnieżdżonych metodach
        } finally {
            UserContext.clear(); // ✅ ZAWSZE wyczyść! (memory leak!)
        }
    }
}

// PUŁAPKA — ThreadLocal z thread pool:
// Wątki w thread pool są reużywane!
// Jeśli nie wywołasz remove(), poprzednie wartości będą widoczne w kolejnych zadaniach!

ExecutorService pool = Executors.newFixedThreadPool(4);
pool.submit(() -> {
    ThreadLocal<String> tl = new ThreadLocal<>();
    tl.set("task1");
    // jeśli nie wywołasz tl.remove() — następne zadanie w tym wątku zobaczy "task1"!
    tl.remove(); // ✅ zawsze czyść w thread pool!
});

// InheritableThreadLocal — wartości dziedziczone przez wątki potomne:
InheritableThreadLocal<String> inherited = new InheritableThreadLocal<>();
inherited.set("parent value");
new Thread(() -> {
    System.out.println(inherited.get()); // "parent value" — dziedziczone!
}).start();
```

---

## 14. Fork/Join Framework

### Pytanie 273 — przetwarzanie divide-and-conquer

```java
import java.util.concurrent.*;

// ForkJoinPool — specjalizowana pula dla algorytmów divide-and-conquer:
// - Work stealing: wolne wątki "kradną" zadania od innych
// - Idealne dla rekurencyjnych, CPU-intensive zadań

// RecursiveTask<V> — zwraca wynik:
class SumTask extends RecursiveTask<Long> {
    private final long[] array;
    private final int lo, hi;
    private static final int THRESHOLD = 1000;

    SumTask(long[] array, int lo, int hi) {
        this.array = array;
        this.lo = lo;
        this.hi = hi;
    }

    @Override
    protected Long compute() {
        if (hi - lo <= THRESHOLD) {
            // Przypadek bazowy — oblicz sekwencyjnie:
            long sum = 0;
            for (int i = lo; i < hi; i++) sum += array[i];
            return sum;
        } else {
            // Podziel i podbij:
            int mid = lo + (hi - lo) / 2;
            SumTask left = new SumTask(array, lo, mid);
            SumTask right = new SumTask(array, mid, hi);
            left.fork();               // uruchom lewą część asynchronicznie
            Long rightResult = right.compute(); // oblicz prawą w tym wątku
            Long leftResult = left.join();       // czekaj na lewą
            return leftResult + rightResult;
        }
    }
}

// Użycie:
long[] bigArray = new long[10_000_000];
Arrays.fill(bigArray, 1L);

ForkJoinPool forkJoinPool = new ForkJoinPool(); // lub ForkJoinPool.commonPool()
Long sum = forkJoinPool.invoke(new SumTask(bigArray, 0, bigArray.length));
System.out.println(sum); // 10_000_000

// RecursiveAction — bez wyniku (void):
class ParallelSort extends RecursiveAction {
    private int[] array;
    private int lo, hi;
    private static final int THRESHOLD = 1000;

    @Override
    protected void compute() {
        if (hi - lo <= THRESHOLD) {
            Arrays.sort(array, lo, hi); // sekwencyjnie
        } else {
            int mid = lo + (hi - lo) / 2;
            invokeAll(
                new ParallelSort(array, lo, mid),
                new ParallelSort(array, mid, hi)
            );
            // merge...
        }
    }
}
```

---

## 15. Race Conditions — jak zapobiegać

### Pytanie 274 — wyścig danych (race condition)

```java
// Race condition — wynik zależy od nieprzewidywalnej kolejności operacji wątków:

// KLASYCZNY PRZYKŁAD — unsynchronized counter:
class RaceCounter {
    private int count = 0; // wspólny stan

    public void increment() {
        count++; // READ-INCREMENT-WRITE — nie atomowe!
    }

    public int getCount() { return count; }
}

// Wynik z 1000 wątków po 1000 incrementów: może być < 1_000_000!

// ROZWIĄZANIA:

// 1. synchronized:
class SyncCounter {
    private int count = 0;
    public synchronized void increment() { count++; }
    public synchronized int getCount() { return count; }
}

// 2. AtomicInteger (lock-free, CAS):
class AtomicCounter {
    private AtomicInteger count = new AtomicInteger(0);
    public void increment() { count.incrementAndGet(); }
    public int getCount() { return count.get(); }
}

// 3. volatile (tylko dla pojedynczych operacji read/write):
class VolatileFlag {
    private volatile boolean active = false;
    public void setActive() { active = true; } // atomowy zapis
    public boolean isActive() { return active; } // atomowy odczyt
    // ale active = !active nie jest atomowe!
}

// Check-then-act — klasyczny race condition:
// ❌ NIEBEZPIECZNE:
if (!map.containsKey(key)) {
    map.put(key, value); // inny wątek mógł dodać klucz między sprawdzeniem a wstawieniem!
}
// ✅ BEZPIECZNE z ConcurrentHashMap:
map.putIfAbsent(key, value); // atomowe check-then-act

// Read-modify-write — race condition:
// ❌ NIEBEZPIECZNE:
balance += amount; // read + modify + write
// ✅ BEZPIECZNE:
synchronized (this) { balance += amount; }
// lub AtomicLong.addAndGet(amount)
```

---

## 16. Livelock i Starvation

### Pytanie 275 — inne problemy współbieżności

```java
// LIVELOCK — wątki są aktywne, ale nie robią postępu (reagują na siebie):
// Przykład: A widzi że B czeka, ustępuje; B widzi że A ustępuje, też ustępuje;
//           A widzi że B ustępuje, próbuje... cykl się powtarza!

// Analogia: dwie osoby w wąskim korytarzu — obie ustępują w tę samą stronę

class LivelockExample {
    static boolean resourceAvailable = true;

    static void worker(String name, Thread other) {
        while (true) {
            if (!other.isAlive() || resourceAvailable) {
                resourceAvailable = false;
                System.out.println(name + " working");
                resourceAvailable = true;
                break;
            } else {
                System.out.println(name + " stepping back...");
                // Może to być livelock jeśli oba ciągle "ustępują"
            }
        }
    }
}
// Rozwiązanie: wprowadź losowe opóźnienie lub priorytet

// STARVATION — wątek nigdy nie dostaje dostępu do zasobu:
// Przyczyny:
// 1. Niskie priorytety wątków (Thread.setPriority())
// 2. Nieefektywne użycie synchronized z notifyAll() (losowy wątek budzony)
// 3. Długo trzymane blokady

// Rozwiązanie: ReentrantLock(true) — fair lock (FIFO dla oczekujących)
ReentrantLock fairLock = new ReentrantLock(true);
// Gwarantuje że wątek czekający najdłużej dostanie lock jako pierwszy

// Thread priority — wskazówka dla planisty OS, nie gwarancja:
Thread lowPriority = new Thread(() -> doWork());
lowPriority.setPriority(Thread.MIN_PRIORITY); // 1
lowPriority.setPriority(Thread.NORM_PRIORITY); // 5 (domyślny)
lowPriority.setPriority(Thread.MAX_PRIORITY); // 10
// Priorytety są tylko wskazówką — JVM/OS może je ignorować!
```

---

## 17. Immutability — bezpieczność bez synchronizacji

### Pytanie 276 — niemutowalne obiekty są thread-safe

```java
// Obiekt niemutowalny jest thread-safe BEZ synchronizacji!
// Kluczowe zasady:
// 1. Wszystkie pola private final
// 2. Brak setterów / metod modyfikujących stan
// 3. Brak "wycieku" referencji do mutowalnych składowych (defensive copy)
// 4. Klasa final (zapobiega dziedziczeniu które mogłoby naruszyć niezmienniki)

public final class ImmutablePoint {
    private final int x;
    private final int y;

    public ImmutablePoint(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public int getX() { return x; }
    public int getY() { return y; }

    // "Modyfikacja" zwraca nowy obiekt:
    public ImmutablePoint translate(int dx, int dy) {
        return new ImmutablePoint(x + dx, y + dy); // nowa instancja!
    }
}

// Niemutowalna klasa z mutowalnym składnikiem:
public final class ImmutableRange {
    private final List<Integer> values;

    public ImmutableRange(List<Integer> values) {
        this.values = List.copyOf(values); // defensywna kopia + niemutowalna!
    }

    public List<Integer> getValues() {
        return values; // List.copyOf() — nie modyfikowalne
    }
}

// Przykłady niemutowalnych klas w JDK:
// String, Integer, Long, Double, BigInteger, BigDecimal
// LocalDate, LocalTime, LocalDateTime (java.time)
// URI, URL (prawie)
// record (jeśli komponenty są niemutowalne)
```

---

## 18. ReadWriteLock — optymalizacja odczytu

### Pytanie 277 — ReentrantReadWriteLock

```java
import java.util.concurrent.locks.*;

// ReadWriteLock — wiele czytelników lub jeden pisarz:
// Regula: read lock można trzymać przez wiele wątków jednocześnie
//         write lock blokuje wszystkich (jeden pisarz, żadnych czytelników)

ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
ReadWriteLock.ReadLock readLock = rwLock.readLock();
ReadWriteLock.WriteLock writeLock = rwLock.writeLock();

Map<String, String> cache = new HashMap<>();

// Czytanie — wielu jednocześnie:
String getValue(String key) {
    readLock.lock();
    try {
        return cache.get(key);
    } finally {
        readLock.unlock();
    }
}

// Pisanie — wyłączny dostęp:
void putValue(String key, String value) {
    writeLock.lock();
    try {
        cache.put(key, value);
    } finally {
        writeLock.unlock();
    }
}

// Kiedy RW lock jest korzystny:
// ✅ Wiele odczytów, rzadkie zapisy
// ❌ Równa liczba odczytów i zapisów — narzut overhead może zaszkodzić
// ❌ Krótkie operacje — overhead blokady może być większy niż zysk

// StampedLock (Java 8+) — nowoczesny, lepszy w wielu przypadkach:
StampedLock sl = new StampedLock();

// Optimistic read — bez blokowania!
long stamp = sl.tryOptimisticRead();
int x = readX(); // odczyt bez locka
int y = readY();
if (!sl.validate(stamp)) { // sprawdź czy nikt nie pisał
    stamp = sl.readLock(); // fallback do read lock
    try { x = readX(); y = readY(); }
    finally { sl.unlockRead(stamp); }
}
```

---

## 19. BlockingQueue — bezpieczna komunikacja

### Pytanie 278 — kolejki blokujące

```java
import java.util.concurrent.*;

// BlockingQueue — thread-safe kolejka do komunikacji wątków:
BlockingQueue<String> queue = new LinkedBlockingQueue<>(100); // bounded

// Wstawianie:
queue.put("item");      // blokuje jeśli pełna
queue.offer("item");    // zwraca false jeśli pełna
queue.offer("item", 100, TimeUnit.MILLISECONDS); // czeka do 100ms

// Pobieranie:
String item = queue.take();  // blokuje jeśli pusta
String polled = queue.poll();  // zwraca null jeśli pusta
String withTimeout = queue.poll(100, TimeUnit.MILLISECONDS); // czeka do 100ms

// Implementacje BlockingQueue:
// ArrayBlockingQueue — bounded, FIFO:
BlockingQueue<Integer> bounded = new ArrayBlockingQueue<>(10);

// LinkedBlockingQueue — opcjonalnie bounded:
BlockingQueue<Integer> linked = new LinkedBlockingQueue<>();    // unbounded
BlockingQueue<Integer> bounded2 = new LinkedBlockingQueue<>(100);

// PriorityBlockingQueue — z priorytetem:
BlockingQueue<Task> priority = new PriorityBlockingQueue<>();

// SynchronousQueue — zero capacity (direct handoff):
BlockingQueue<String> sync = new SynchronousQueue<>();
// offer() blokuje dopóki take() nie zostanie wywołane przez inny wątek!
// Używane w Executors.newCachedThreadPool()

// Wzorzec Producer-Consumer z BlockingQueue:
class Producer implements Runnable {
    private final BlockingQueue<String> queue;
    Producer(BlockingQueue<String> q) { this.queue = q; }

    @Override
    public void run() {
        for (int i = 0; i < 10; i++) {
            try {
                queue.put("Item-" + i); // blokuje jeśli pełna
                System.out.println("Produced: Item-" + i);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }
}

class Consumer implements Runnable {
    private final BlockingQueue<String> queue;
    Consumer(BlockingQueue<String> q) { this.queue = q; }

    @Override
    public void run() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                String item = queue.poll(1, TimeUnit.SECONDS);
                if (item != null) System.out.println("Consumed: " + item);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }
}
```

---

## 20. Podsumowanie — kluczowe zasady wielowątkowości

### Pytanie 279–299 — najważniejsze koncepty

```java
// ===== PODSTAWOWE ZASADY =====

// 1. Zawsze wywołuj start(), NIE run() — start() tworzy nowy wątek!
// 2. Nie możesz ponownie uruchomić wątku po TERMINATED
// 3. Daemon thread — JVM kończy się gdy nie ma non-daemon threads
Thread daemon = new Thread(() -> { while(true) { } });
daemon.setDaemon(true); // musi być przed start()!
daemon.start();

// 4. Thread.sleep() — pauza, NIE zwalnia monitora!
// wait() — zwalnia monitor i czeka
// Thread.yield() — wskazówka że wątek może ustąpić (brak gwarancji)

// 5. interrupt() — ustawia flagę, nie zatrzymuje wątku!
Thread t = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) {
        // sprawdzaj flagę ręcznie jeśli brak sleep/wait
    }
});
t.interrupt(); // ustaw flagę

// 6. Po złapaniu InterruptedException — przywróć flagę:
try { Thread.sleep(1000); }
catch (InterruptedException e) { Thread.currentThread().interrupt(); }

// ===== WIDOCZNOŚĆ PAMIĘCI =====
// Bez happens-before — jeden wątek może nie widzieć zmian innego wątku!
// Rozwiązania: synchronized, volatile, AtomicX, happens-before reguły

// ===== ATOMOWOŚĆ =====
// i++ NIE jest atomowe (read-increment-write)
// Tylko operacje odczytu/zapisu podstawowych typów (poza long/double) są atomowe
// long/double: 64-bit — może być dwa 32-bit zapisy → użyj volatile lub AtomicLong

// ===== HIERARCHIA BEZPIECZEŃSTWA =====
// Najlepsza: Immutable objects — brak synchronizacji potrzebnej
// Dobra: ThreadLocal — prywatne kopie per wątek
// Dobra: Concurrent collections — gotowe thread-safe kolekcje
// Umiarkowana: synchronized/Lock — ręczna synchronizacja
// Ostatnia szansa: volatile — tylko widoczność, nie atomowość złożonych ops
```

**Tabela kluczowych narzędzi synchronizacji:**

| Narzędzie | Gwarancja | Typ blokady | Nadaje się do |
|---|---|---|---|
| `synchronized` | widoczność + atomowość | monitor (mutex) | Ogólna synchronizacja |
| `volatile` | widoczność | brak (happens-before) | Flagi, proste zmienne |
| `AtomicInteger` itp. | atomowość (CAS) | lock-free | Liczniki, zmienne |
| `ReentrantLock` | widoczność + atomowość | reentrant mutex | Zaawansowana synchronizacja |
| `ReadWriteLock` | R: wiele, W: jeden | read/write lock | Dużo odczytów |
| `Semaphore` | ograniczony dostęp | counting semaphore | Resource pool |
| `CountDownLatch` | oczekiwanie N | jednorazowe | Start/await tasks |
| `CyclicBarrier` | bariera wielokrotna | cykliczne | Fazy przetwarzania |
| `BlockingQueue` | FIFO thread-safe | wewnętrzny | Producer-Consumer |
| `ConcurrentHashMap` | thread-safe Map | CAS + segmenty | Współdzielona mapa |
| `CompletableFuture` | asynchroniczne | brak (callbacks) | Async pipelines |

**Zasady zapobiegania problemom:**

1. **Deadlock** — ustal globalny porządek blokad, używaj `tryLock()` z timeoutem.
2. **Livelock** — wprowadź losowe opóźnienie lub hierarchię priorytetów.
3. **Starvation** — użyj `ReentrantLock(true)` (fair), nie ustawiaj skrajnych priorytetów.
4. **Race condition** — `synchronized`, `AtomicX`, niemutowalne obiekty.
5. **Visibility** — `volatile`, `synchronized`, `happens-before` reguły.
6. **Memory leak** — zawsze `ThreadLocal.remove()` w thread pool, `ExecutorService.shutdown()`.
