# Why The Graph Cache Matters For Network Optimization

This note explains, in plain language, why the optimizer needs a prebuilt graph, why that graph is cached on each laptop, and why a fresh machine can take time before it can answer quickly.

## The simple idea

The optimizer is not just choosing store locations on a map.

It is answering a much harder question:

> "For every demand pocket in the city, which possible dark-store location can serve it within policy radius, and at what travel cost?"

That answer is the foundation of every scenario:

- `103 fixed stores`
- `144 fixed stores`
- `0 fixed stores`
- different service radii
- different exception radii
- different cost assumptions

The system represents that foundation as a **graph**.

## What the "graph" actually means here

In this context, a graph is not a fancy visual.

It is a precomputed network of:

- **Demand cells**: small demand pockets across the city
- **Candidate sites**: possible locations where a Standard dark store could exist
- **Edges**: a stored answer to "this candidate can serve this demand cell" with distance/cost information

So the graph is really a very large lookup structure:

> "Candidate A can cover Demand Cell X at Y km and Z rupees"  
> "Candidate B cannot cover Demand Cell X within the allowed radius"  
> "Candidate C can cover it only if exception radius is allowed"

Without this structure, the optimizer has to recompute those relationships from scratch every time.

## Why this takes time

For Bangalore-scale runs, the numbers are large enough that brute force is too slow.

Typical scale in our current runs:

- around **23,255 in-scope demand cells**
- up to **15,000 candidate Standard sites** in fast meeting mode
- even more in full exact mode

If we naively compare every candidate site to every demand cell, that is on the order of:

- **23,255 x 15,000 = about 349 million possible candidate-demand pairs**

And for the larger exact universe, it is even worse.

Not all of those become valid service links, but the system still has to do a large amount of road-distance and feasibility work to discover which ones matter.

That is why the graph build is expensive.

## Why road distance makes this harder

This is not straight-line geometry only.

The planner relies on **road-network travel behavior** through OSRM, because supply-chain decisions need road-aware distance/cost, not just "as the crow flies".

So for many candidate-demand pairs, the system needs to know:

- can this route be served?
- what is the road distance?
- is it inside the base service radius?
- is it only feasible under exception radius?

Doing that repeatedly without a cache would make every scenario run far too slow.

## Why the cache exists

The cache exists so we do the expensive geography work once and reuse it many times.

Think of it this way:

- **Code** is the recipe
- **The cached graph** is the pre-cut, pre-measured ingredient set

If the graph is already present on the machine:

- the optimizer can jump faster to scenario solving
- slider changes are much cheaper to evaluate
- comparisons like `103 vs 144 vs 0` become practical

If the graph is **not** present on the machine:

- the laptop must build it locally
- that build can take a long time
- until it exists, the UI feels blocked even though the code itself is fine

## Why downloading to a new laptop still matters

When we move to a new laptop, we are not only moving code.

We also need the heavy machine-local artifacts:

- candidate graph caches
- candidate pools
- related precomputed optimization assets

Without them, the new laptop has to regenerate the graph from raw demand + polygons + road-network checks.

That is why "it works on one machine" does not automatically mean "it is instant on another machine."

The code can be identical while the cached optimization substrate is missing.

## Why we cannot simply skip the graph

If we skip the graph, we get one of two bad outcomes:

1. **Very slow runtime**
   - the planner repeatedly recomputes service feasibility
   - each scenario becomes too slow to use interactively

2. **Lower-quality or misleading answers**
   - if we reduce the search too aggressively to avoid graph cost,
   - we risk getting solutions that are fast but not trustworthy

So the graph is not optional plumbing.

It is the structure that makes the optimization both:

- **fast enough to use**
- **accurate enough to trust**

## Why cache reuse is so valuable for business work

Once the graph for a given city/input frame exists, we can reuse it across many business questions:

- What if we keep 103 fixed stores?
- What if we keep 144?
- What if we go clean-slate?
- What if radius changes from 3 km to 3.5 km?
- What if exception policy changes?

The expensive geography work stays mostly the same.

Then the optimizer can focus on the decision layer:

- which sites to open
- which ones are rescue sites
- which ones need exception radius
- what coverage and cost tradeoffs result

That is the real reason the cache is so important:  
it turns a geography-heavy compute problem into a reusable planning substrate.

## When the graph must be rebuilt

The graph can usually be reused only when the base problem frame is still the same, for example:

- same city demand frame
- same business polygons / exclusion islands
- same candidate-site universe
- same maximum graph radius envelope

It may need rebuilding if we materially change:

- the demand universe
- the business boundary
- the candidate universe
- the max service-distance envelope used to build feasible links

In short:

> Small scenario changes can often reuse the graph.  
> Big structural input changes usually cannot.

## The business summary

If a manager asks, "Why do we need this graph and cache at all?", the clean answer is:

> Because the optimizer is not only choosing sites; it is first learning the city-wide service relationship between every meaningful demand pocket and every meaningful candidate site.  
> That relationship is expensive to compute, so we cache it.  
> Once cached, scenario analysis becomes practical.  
> Without that cache, a fresh laptop must rebuild the city network foundation before it can answer quickly and credibly.

## One-sentence version

> The graph cache is the precomputed city service network that lets us compare `103`, `144`, and `0` fixed-store worlds quickly and accurately instead of recomputing millions of road-distance coverage relationships from scratch every time.
