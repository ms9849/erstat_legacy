"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
class QueueNode {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}
class Queue {
    constructor() {
        this._size = 0;
    }
    get size() {
        return this._size;
    }
    push(value) {
        let newNode = new QueueNode(value);
        if (!this._tail)
            this._head = this._tail = newNode;
        else {
            this._tail.next = newNode;
            this._tail = newNode;
        }
        this._size++;
    }
    pop() {
        let front = this._head;
        if (!front) {
            return;
        }
        if (!this._head.next) {
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
    *iterator() {
        let currentItem = this._head;
        while (currentItem) {
            yield currentItem.value;
            currentItem = currentItem.next;
        }
    }
    toArray() {
        return [...this];
    }
}
exports.Queue = Queue;
