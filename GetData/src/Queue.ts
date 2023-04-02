class QueueNode<T> {
    value: T;
    next: QueueNode<T>;

    constructor(value: T) {
        this.value = value;
        this.next = null;
    }
}

export class Queue<T> {
    private _size: number = 0;
    private _head?: QueueNode<T>;
    private _tail?: QueueNode<T>;

    get size(): number {
        return this._size;
    }

    push(value: T): void {
        let newNode: QueueNode<T> = new QueueNode<T>(value);

        if(!this._tail) 
            this._head = this._tail = newNode;
        else {
            this._tail.next = newNode;
            this._tail = newNode;
        }

        this._size++;
    }

    pop(): T {
        let front: QueueNode<T> = this._head;

        if(!front) {
            return;
        }

        if(!this._head.next) {
            this._head = null;
        }
        else {
            this._head = this._head.next;
            front.next = null;
        }
        this._size--;
        return front.value;
    }

    [Symbol.iterator]() {
        return this.iterator();
    }

    *iterator(): IterableIterator<T> {
        let currentItem = this._head;
    
        while(currentItem) {
          yield currentItem.value
          currentItem = currentItem.next
        }
    }

    toArray(): T[] {
        return [...this];
    }
}
