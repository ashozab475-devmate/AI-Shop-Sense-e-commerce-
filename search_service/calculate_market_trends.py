"""
Calculates real market trend scores from the ABO dataset CSV.
Run from project root: python search_service/calculate_market_trends.py
"""
import csv, json, statistics
from pathlib import Path
from collections import defaultdict

CSV_FILE    = Path("search_service/data/abo_dataset_combined.csv")
OUTPUT_FILE = Path("market_trends.json")

def main():
    with open(CSV_FILE, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    print(f"Loaded {len(rows)} products from CSV")

    category_prices = defaultdict(list)
    for row in rows:
        cat = row.get('category', '').strip()
        try:
            price = float(row.get('price', 0) or 0)
            if price > 0 and cat:
                category_prices[cat].append(price)
        except ValueError:
            continue

    all_prices = [p for prices in category_prices.values() for p in prices]
    overall_avg = statistics.mean(all_prices)
    overall_std = statistics.stdev(all_prices) if len(all_prices) > 1 else 1

    print(f"Overall avg: ${overall_avg:.2f}, std: ${overall_std:.2f}\n")

    trends = {}
    print(f"{'Category':<25} {'Count':>6} {'Avg Price':>10} {'Trend Score':>12}")
    print("-" * 60)

    for cat, prices in sorted(category_prices.items(), key=lambda x: -len(x[1])):
        avg_price  = statistics.mean(prices)
        median     = statistics.median(prices)
        count      = len(prices)
        std_dev    = statistics.stdev(prices) if count > 1 else 0
        volatility = round((std_dev / avg_price) * 100, 1) if avg_price > 0 else 0
        z_score    = (avg_price - overall_avg) / overall_std
        trend_score = round(max(-5.0, min(5.0, z_score * 2)), 2)

        trends[cat] = {
            "count":              count,
            "avg_price":          round(avg_price, 2),
            "median_price":       round(median, 2),
            "min_price":          round(min(prices), 2),
            "max_price":          round(max(prices), 2),
            "std_dev":            round(std_dev, 2),
            "price_volatility":   volatility,
            "market_trend_score": trend_score,
            "data_source":        "ABO Amazon Dataset (3820 products)",
        }
        print(f"{cat:<25} {count:>6} ${avg_price:>9.2f} {trend_score:>+11.2f}")

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(trends, f, indent=2)

    print(f"\nSaved {len(trends)} categories to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
