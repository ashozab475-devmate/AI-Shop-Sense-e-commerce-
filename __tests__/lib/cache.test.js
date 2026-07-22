import { get, set, clear, getOrFetch } from '@/lib/cache';

describe('Cache Utility', () => {
  beforeEach(() => {
    clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('set and get', () => {
    it('should store and retrieve value', () => {
      set('key1', 'value1');
      expect(get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent key', () => {
      expect(get('non-existent')).toBeUndefined();
    });

    it('should store objects', () => {
      const obj = { id: 1, name: 'Test' };
      set('obj-key', obj);
      expect(get('obj-key')).toEqual(obj);
    });

    it('should store arrays', () => {
      const arr = [1, 2, 3];
      set('arr-key', arr);
      expect(get('arr-key')).toEqual(arr);
    });
  });

  describe('TTL expiration', () => {
    it('should expire value after TTL', () => {
      set('ttl-key', 'value', 1000); // 1 second TTL
      expect(get('ttl-key')).toBe('value');

      jest.advanceTimersByTime(1100);
      expect(get('ttl-key')).toBeUndefined();
    });

    it('should not expire value before TTL', () => {
      set('ttl-key', 'value', 5000); // 5 seconds TTL
      jest.advanceTimersByTime(2000);
      expect(get('ttl-key')).toBe('value');
    });

    it('should use default TTL if not specified', () => {
      set('default-ttl', 'value'); // Uses default TTL
      expect(get('default-ttl')).toBe('value');
    });
  });

  describe('clear', () => {
    it('should clear all cache', () => {
      set('key1', 'value1');
      set('key2', 'value2');
      clear();
      expect(get('key1')).toBeUndefined();
      expect(get('key2')).toBeUndefined();
    });
  });

  describe('getOrFetch', () => {
    it('should return cached value if exists', async () => {
      set('cached-key', 'cached-value');
      const fetchFn = jest.fn();

      const result = await getOrFetch('cached-key', fetchFn);
      expect(result).toBe('cached-value');
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache value if not exists', async () => {
      const fetchFn = jest.fn().mockResolvedValueOnce('fetched-value');

      const result = await getOrFetch('new-key', fetchFn);
      expect(result).toBe('fetched-value');
      expect(fetchFn).toHaveBeenCalled();
      expect(get('new-key')).toBe('fetched-value');
    });

    it('should handle fetch errors', async () => {
      const fetchFn = jest.fn().mockRejectedValueOnce(new Error('Fetch error'));

      await expect(getOrFetch('error-key', fetchFn)).rejects.toThrow('Fetch error');
      expect(get('error-key')).toBeUndefined();
    });

    it('should use custom TTL for fetched value', async () => {
      const fetchFn = jest.fn().mockResolvedValueOnce('value');

      await getOrFetch('ttl-key', fetchFn, 2000);
      expect(get('ttl-key')).toBe('value');

      jest.advanceTimersByTime(2100);
      expect(get('ttl-key')).toBeUndefined();
    });
  });
});
