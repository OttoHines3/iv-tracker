// src/app/api/atm-iv/route.js
import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.TRADIER_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Missing TRADIER_TOKEN in env" },
      { status: 500 }
    );
  }

  try {
    // 1) Get all expirations for SPX
    const expUrl =
      "https://api.tradier.com/v1/markets/options/expirations" +
      "?symbol=SPX&includeAllRoots=true";
    const expRes = await fetch(expUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!expRes.ok) {
      const txt = await expRes.text();
      return NextResponse.text(txt, { status: expRes.status });
    }
    const expJson = await expRes.json();
    let dates = expJson.expirations?.date;
    if (!dates) {
      return NextResponse.json(
        { error: "No expirations found" },
        { status: 404 }
      );
    }
    dates = Array.isArray(dates) ? dates : [dates];
    const expiration = dates[0]; // pick the soonest

    // 2) Get the full chain _with_ greeks for that expiration
    const chainUrl =
      `https://api.tradier.com/v1/markets/options/chains` +
      `?symbol=SPX&expiration=${expiration}&greeks=true`;
    const chainRes = await fetch(chainUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!chainRes.ok) {
      const txt = await chainRes.text();
      return NextResponse.text(txt, { status: chainRes.status });
    }
    const chainJson = await chainRes.json();
    let rawOpts = chainJson.options?.option;
    if (!rawOpts) {
      return NextResponse.json(
        { error: "No options in chain" },
        { status: 404 }
      );
    }
    const options = Array.isArray(rawOpts) ? rawOpts : [rawOpts];

    // 3) Get SPX spot price
    const quoteUrl = "https://api.tradier.com/v1/markets/quotes?symbols=SPX";
    const quoteRes = await fetch(quoteUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!quoteRes.ok) {
      const txt = await quoteRes.text();
      return NextResponse.text(txt, { status: quoteRes.status });
    }
    const quoteJson = await quoteRes.json();
    const spot = quoteJson.quotes?.quote?.last;
    if (spot == null) {
      return NextResponse.json(
        { error: "No SPX quote available" },
        { status: 404 }
      );
    }

    // 4) Find the ATM contract
    let atm = null;
    let bestDiff = Infinity;
    for (const o of options) {
      const diff = Math.abs(o.strike - spot);
      if (diff < bestDiff) {
        bestDiff = diff;
        atm = o;
      }
    }
    if (!atm) {
      return NextResponse.json(
        { error: "No ATM option found" },
        { status: 404 }
      );
    }

    // 5) Pull the IV out of the greeks block that chain returned
    const impliedVol = atm.greeks?.mid_iv ?? null;

    // 6) Return everything
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        expiration,
        underlying: spot,
        strike: atm.strike,
        optionSymbol: atm.symbol,
        impliedVol,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
