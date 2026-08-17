/**
 * CampusMiner AI - High-Performance Utility & Concurrency Engine
 * Yielding, Debounce, LRU Caching, DOM Batching & Async Task Queue
 */

// 1. Cooperative Yielding to prevent UI freezing (ensures smooth 60 FPS)
const yieldToMain = () => {
  if (typeof scheduler !== 'undefined' && scheduler.yield) {
    return scheduler.yield();
  }
  return new Promise(resolve => setTimeout(resolve, 0));
};

// 2. Debounce helper to optimize search input listeners
const debounce = (func, wait = 150) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 3. High-Performance LRU In-Memory Cache (Stores up to 50 parsed datasets)
class LRUCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    // Refresh position
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }
}

// 4. Non-Blocking Concurrency Queue for Batch Crawling
class ConcurrencyQueue {
  constructor(concurrency = 2) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add(taskFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ taskFn, resolve, reject });
      this.next();
    });
  }

  async next() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { taskFn, resolve, reject } = this.queue.shift();

    try {
      // Yield before running task
      await yieldToMain();
      const result = await taskFn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.running--;
      // Yield to main thread between consecutive batch jobs
      await yieldToMain();
      this.next();
    }
  }

  clear() {
    this.queue = [];
  }
}

// 5. Chunked DOM Renderer to eliminate layout thrashing for 500+ items
const renderInChunks = async (container, items, renderItemHtmlFn, chunkSize = 40) => {
  container.innerHTML = '';
  if (!items || items.length === 0) return;

  const total = items.length;
  for (let i = 0; i < total; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const fragment = document.createRange().createContextualFragment(
      chunk.map(item => renderItemHtmlFn(item)).join('')
    );
    container.appendChild(fragment);
    
    // Yield to allow browser to paint every chunk
    if (i + chunkSize < total) {
      await yieldToMain();
    }
  }
};

// Global exports
window.PerfUtils = {
  yieldToMain,
  debounce,
  LRUCache,
  ConcurrencyQueue,
  renderInChunks
};
