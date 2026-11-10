---
layout: default
title: "Horizon Summary: 2026-11-10 (EN)"
date: 2026-11-10
lang: en
items: [{"key": "hackernews:story:50428907", "title": "watched.earth: Browser tool shows last 7 days satellite passes and imagery", "anchor": "item-ai-news-1", "section": "AI News", "score": 9.0}, {"key": "rss:simonwillison.net_atom_everything_:86b4ba3155e4ca0c", "title": "llm-anthropic 0.31 adds Fable 5.2 and Mythos 5.2 support", "anchor": "item-ai-news-2", "section": "AI News", "score": 9.0}, {"key": "rss:huggingface.co_blog_feed.xml:ac8f18750241a65f", "title": "NVIDIA Releases Nemotron-Personas-Finance-Japan Synthetic Dataset on Hugging Face", "anchor": "item-ai-news-3", "section": "AI News", "score": 8.0}, {"key": "rss:simonwillison.net_atom_everything_:ffd0277ad7cd64c2", "title": "Simon Willison open-sources Beep Locator: multi-device audio triangulation built with Claude Code", "anchor": "item-ai-news-4", "section": "AI News", "score": 8.0}, {"key": "reddit:subreddit-rss:t3_1xs7ffm", "title": "DeepSeek V4.1 Flash vs Qwen 3.8 FN: Local MoE Benchmark", "anchor": "item-ai-news-5", "section": "AI News", "score": 8.0}, {"key": "rss:huggingface.co_blog_feed.xml:55d059b88c6c576a", "title": "Amazon introduces HOPE pruning for MoE models on Hugging Face blog", "anchor": "item-ai-news-6", "section": "AI News", "score": 7.0}, {"key": "hackernews:story:50429734", "title": "E-means: Community tests show mixed speedups vs k-means", "anchor": "item-ai-news-7", "section": "AI News", "score": 6.0}, {"key": "rss:www.infoq.cn_feed:84d86f0483459a20", "title": "Airbnb cuts recommendation latency from days to seconds with Chronon", "anchor": "item-ai-news-8", "section": "AI News", "score": 6.0}, {"key": "reddit:subreddit-rss:t3_1xrydgx", "title": "Reddit user shares Qwen3.5-4B neurons that shift personality when activated", "anchor": "item-ai-news-9", "section": "AI News", "score": 6.0}, {"key": "reddit:subreddit-rss:t3_1xs81f3", "title": "Reddit guide introduces neuron steering on Qwen3.5-4B with architectural details but no runnable code", "anchor": "item-ai-news-10", "section": "AI News", "score": 6.0}, {"key": "youtube:video:Xwpi0ITkL3U", "title": "Complete GitHub Actions Course: Beginner to Pro", "anchor": "item-social-hot-1", "section": "X / YouTube Highlights", "score": 8.0}]
---

> Showing 11 of 135 fetched items.

---

**AI News**
1. [watched.earth: Browser tool shows last 7 days satellite passes and imagery](#item-ai-news-1) ⭐️ 9.0/10
2. [llm-anthropic 0.31 adds Fable 5.2 and Mythos 5.2 support](#item-ai-news-2) ⭐️ 9.0/10
3. [NVIDIA Releases Nemotron-Personas-Finance-Japan Synthetic Dataset on Hugging Face](#item-ai-news-3) ⭐️ 8.0/10
4. [Simon Willison open-sources Beep Locator: multi-device audio triangulation built with Claude Code](#item-ai-news-4) ⭐️ 8.0/10
5. [DeepSeek V4.1 Flash vs Qwen 3.8 FN: Local MoE Benchmark](#item-ai-news-5) ⭐️ 8.0/10
6. [Amazon introduces HOPE pruning for MoE models on Hugging Face blog](#item-ai-news-6) ⭐️ 7.0/10
7. [E-means: Community tests show mixed speedups vs k-means](#item-ai-news-7) ⭐️ 6.0/10
8. [Airbnb cuts recommendation latency from days to seconds with Chronon](#item-ai-news-8) ⭐️ 6.0/10
9. [Reddit user shares Qwen3.5-4B neurons that shift personality when activated](#item-ai-news-9) ⭐️ 6.0/10
10. [Reddit guide introduces neuron steering on Qwen3.5-4B with architectural details but no runnable code](#item-ai-news-10) ⭐️ 6.0/10

**X / YouTube Highlights**
1. [Complete GitHub Actions Course: Beginner to Pro](#item-social-hot-1) ⭐️ 8.0/10

---

## AI News

<a id="item-ai-news-1"></a>
### [watched.earth: Browser tool shows last 7 days satellite passes and imagery](https://www.watched.earth/) ⭐️ 9.0/10

watched.earth is a browser-based, open-source tool that lets users enter any location and see every satellite that passed over it in the last 7 days. It uses SGP4 propagation on the CelesTrak catalog \(about 17,000 objects\) computed client-side in roughly half a second, then fetches actual Sentinel-2, Landsat, and NASA images from those passes. The site renders all orbits on the GPU, solves Kepler&\#x27;s equation each frame, and only marks a pass as &quot;watched&quot; when a real image exists. The author notes Sentinel-2 timestamps can be 5-10 minutes off the actual ground crossing. The code is on GitHub \(github.com/dev-Armaan/satellites\) and the service does not store user locations.

hackernews · a585gupt · Nov 9, 17:51 · [Discussion](https://news.ycombinator.com/item?id=50428907)

**「Why it matters」** Geospatial analysts, researchers, and anyone needing recent satellite imagery for a specific spot can get an instant, visual overview without using bulk portals like Copernicus. First step: go to watched.earth, type a place name or coordinates, and review the list of passes with linked imagery — useful for quick verification, change detection, or planning fieldwork.

**Tags**: `#卫星影像`, `#地理空间`, `#开源工具`, `#Sentinel-2`, `#Landsat`

---

<a id="item-ai-news-2"></a>
### [llm-anthropic 0.31 adds Fable 5.2 and Mythos 5.2 support](https://simonwillison.net/2026/Nov/9/llm-anthropic/) ⭐️ 9.0/10

Simon Willison released llm-anthropic 0.31, adding support for Anthropic&\#x27;s newly announced Fable 5.2 and Mythos 5.2 models. The plugin can be installed via \`uv tool install llm\`, \`llm install llm-anthropic\`, and \`llm keys set anthropic\`. The model identifier for Fable 5.2 is \`claude-fable-5.2\`. Willison tested SVG generation of a pelican riding a bicycle across all five reasoning levels \(low, medium, high, xhigh, max\). The xhigh level produced the best result, while max failed entirely after consuming 128,000 thinking tokens — a regression not present in Fable 5 or 5.1. Comparative outputs are linked in the release notes.

rss · Simon Willison · Nov 9, 23:58

**「Why it matters」** Developers using the LLM CLI can immediately experiment with Anthropic&\#x27;s latest Fable and Mythos models, including their reasoning-level controls. The max-level token exhaustion bug means users should avoid \`max\` for now and default to \`xhigh\` for highest-quality output. Installation takes three commands and an API key.

**Tags**: `#llm`, `#anthropic`, `#cli-tools`, `#svg-generation`, `#reasoning-levels`

---

<a id="item-ai-news-3"></a>
### [NVIDIA Releases Nemotron-Personas-Finance-Japan Synthetic Dataset on Hugging Face](https://huggingface.co/blog/nvidia/nemotron-personas-finance-japan) ⭐️ 8.0/10

NVIDIA has released Nemotron-Personas-Finance-Japan, a synthetic dataset capturing Japanese demographics and financial context, via the Hugging Face Hub. The dataset is intended for LLM training and bias evaluation in financial AI applications. The Hugging Face blog post likely provides direct download links, usage examples, licensing information, and documentation, though full details require viewing the complete announcement.

rss · Hugging Face Blog · Nov 9, 15:05

**「Why It Matters」** Practitioners working on Japanese financial NLP, fairness testing, or synthetic data research can immediately access this NVIDIA-originated dataset for model training and bias benchmarking. First step: visit the Hugging Face Hub page linked in the blog post to review the license, format, and usage examples before integrating into pipelines.

**Tags**: `#dataset`, `#synthetic-data`, `#finance`, `#japan`, `#nvidia`

---

<a id="item-ai-news-4"></a>
### [Simon Willison open-sources Beep Locator: multi-device audio triangulation built with Claude Code](https://simonwillison.net/2026/Nov/9/mysterious-beeps/) ⭐️ 8.0/10

Simon Willison built and open-sourced Beep Locator, a web-based system that uses multiple phones, tablets, and laptops as distributed microphones to triangulate the source of an intermittent beep. The Python web server coordinates listeners via WebSockets and WebAudio; devices play chirps to estimate relative positions \(with a manual &quot;Rough mode&quot; fallback\), record 60-second audio buffers, and detect beeps using FFT-based detection. A calibration chirp aligns clips from all listeners, enabling time-difference-of-arrival localization. Willison developed the project with Claude Code \(Opus 5.5, Extra thinking mode\) starting from a problem statement; the AI retrieved the 2007 BeepBeep acoustic-ranging paper and implemented the full stack, including over-the-air code updates to listeners. In practice, the system located a beeping carbon-monoxide detector to within ~40 cm. The complete source is on GitHub at simonw/beep-locator.

rss · Simon Willison · Nov 9, 23:57

**「Why it matters」** Developers and hobbyists who need to locate intermittent sounds — failing alarms, leaking pipes, electrical faults — can clone the repository, run the Python server, and join any number of browser-equipped devices via QR code to get a working triangulation map in minutes. The project also serves as a reference for AI-assisted full-stack development: it shows how a single prompt-to-completion loop with Claude Code produced a coordinating server, real-time WebSocket clients, DSP detection logic, and a self-updating listener mechanism.

**Tags**: `#AI-assisted development`, `#audio processing`, `#multi-device coordination`, `#practical tool`, `#Claude Code`

---

<a id="item-ai-news-5"></a>
### [DeepSeek V4.1 Flash vs Qwen 3.8 FN: Local MoE Benchmark](https://www.reddit.com/r/LocalLLaMA/comments/1xs7ffm/same_prompt_deepseek_v41_flash_vs_qwen_38_fn_94/) ⭐️ 8.0/10

A Reddit user benchmarked DeepSeek V4.1 Flash \(UD IQ1\_M quantization\) against Qwen 3.8 FN \(NVFP4 quantization\) on a complex V8 engine coding task using Basalt and Quecto Harness on an RTX 5090 + RTX 5060 Ti system. DeepSeek ran as a single agent at ~94 tok/s, generating 250k tokens in ~60 minutes with 346k context and no compaction; the engine worked on the first try but had limited cutaway detail. Qwen used a main agent plus five subagents \(up to three concurrent\) at ~350 tok/s aggregate, producing 443k+ main-agent tokens and 804k total context with two compactions in ~70 minutes; it built more parts and added sound but suffered from floating parts and two subagents that failed to write files. The author notes this was a one-shot test with a prompt likely in both models&\#x27; training data.

reddit · r/LocalLLaMA · /u/jesdga95 · Nov 9, 23:32

**「Why It Matters」** Practitioners evaluating locally runnable MoE models for coding tasks can compare quantization trade-offs \(IQ1\_M vs NVFP4\), agent architectures \(single vs multi-agent\), and real-world inference speeds on high-end consumer hardware. First step: run the provided V8 engine prompt on Basalt/Quecto or a similar stack to replicate the comparison.

**Tags**: `#local-llm`, `#moe-models`, `#quantization`, `#inference-benchmark`, `#multi-agent`

---

<a id="item-ai-news-6"></a>
### [Amazon introduces HOPE pruning for MoE models on Hugging Face blog](https://huggingface.co/blog/amazon/higher-order-pruning-experts) ⭐️ 7.0/10

Amazon published a blog post on Hugging Face introducing HOPE \(Higher-Order Pruning Experts\), a pruning method for mixture-of-experts \(MoE\) models that aims to preserve expert relationships. The post appears on the Hugging Face blog under Amazon&\#x27;s authorship. No source content is available to confirm technical details, code availability, benchmarks, hardware requirements, or licensing.

rss · Hugging Face Blog · Nov 9, 12:34

**「Why it matters」** Practitioners working with MoE models who need to reduce model size or inference cost may want to evaluate HOPE once the full post is accessible. The first step is to read the Hugging Face blog post at the provided URL to check for implementation details, example code, and compatibility with existing MoE frameworks.

**Tags**: `#mixture-of-experts`, `#model-pruning`, `#model-optimization`, `#aws`, `#hugging-face`

---

<a id="item-ai-news-7"></a>
### [E-means: Community tests show mixed speedups vs k-means](https://e-means.github.io/) ⭐️ 6.0/10

A Hacker News discussion covers E-means, a k-means variant claiming to outperform standard k-means in one-tenth the epochs. Community members report mixed real-world results: a 146× GPU speedup when adapted to an IVF index \(code-daemon project\), 2.5× faster bulk reindexing for hierarchical clustering \(antfly project\), but a negative result for spherical mesh relaxation where it was &quot;definitely not better.&quot; The thread contains no official documentation, installation guide, API, license, or benchmark details — only practitioner anecdotes. Readers must visit the project site \(e-means.github.io\) for usable information.

hackernews · porridgeraisin · Nov 9, 18:45 · [Discussion](https://news.ycombinator.com/item?id=50429734)

**「Why it matters」** ML engineers evaluating faster clustering should test E-means on their specific workload — especially IVF indexes or bulk reindexing pipelines — before adopting, since results vary by use case. The first step is visiting e-means.github.io to find implementation details, dependencies, and integration guidance.

**Tags**: `#clustering`, `#k-means`, `#optimization`, `#machine-learning`, `#algorithm`

---

<a id="item-ai-news-8"></a>
### [Airbnb cuts recommendation latency from days to seconds with Chronon](https://www.infoq.cn/article/yuRNB72KsEbjGYSkV7FY?utm_source=rss&amp;utm_medium=article) ⭐️ 6.0/10

The article title states that Airbnb used Chronon, a feature engineering platform, to reduce recommendation latency from two days down to seconds. The full article content was not provided, so architectural details, implementation steps, and measurable results cannot be verified from the supplied material.

rss · InfoQ 中文 · Nov 10, 09:11

**「Why it matters」** If the case study delivers on its title, ML engineers building real-time recommendation systems can reference Airbnb&\#x27;s Chronon adoption as a proven path to move batch feature pipelines to low-latency serving. The first step would be to read the full article on InfoQ for architecture specifics and then evaluate Chronon against your current feature store.

**Tags**: `#特征工程`, `#实时推荐`, `#ML基础设施`, `#Chronon`, `#延迟优化`

---

<a id="item-ai-news-9"></a>
### [Reddit user shares Qwen3.5-4B neurons that shift personality when activated](https://www.reddit.com/r/LocalLLaMA/comments/1xrydgx/more_interesting_and_unusual_qwen354b_neurons/) ⭐️ 6.0/10

A Reddit user reports discovering specific neurons in Qwen3.5-4B that dramatically alter model behavior when activated. The post identifies five neuron indices: L11 N8147 acts as a contrarian-sycophantic dial \(snarky/lying vs. obsequious/gullible\); L6 N9195 triggers state-propaganda persona claiming Chinese government training; L7 N4213 produces baby-talk explanations; L17 N5680 causes religious/CCP obsessive repetition; L7 N8916 makes the model behave like a TV channel guide. The findings are user-reported on Reddit without verification, methodology, reproduction code, or tooling.

reddit · r/LocalLLaMA · /u/Tasty-Ad-3753 · Nov 9, 17:46

**「Why it matters」** Mechanistic interpretability and model-steering researchers can use these neuron indices as concrete starting points for experiments on Qwen3.5-4B. The first step is to replicate the activations using steering vectors or activation patching to verify whether these neurons reliably control the described behaviors.

**Tags**: `#mechanistic-interpretability`, `#model-steering`, `#qwen`, `#neuron-analysis`, `#local-llm`

---

<a id="item-ai-news-10"></a>
### [Reddit guide introduces neuron steering on Qwen3.5-4B with architectural details but no runnable code](https://www.reddit.com/r/LocalLLaMA/comments/1xs81f3/how_to_mess_around_with_neurons_a_short_guide/) ⭐️ 6.0/10

A Reddit user shares a conceptual guide for neuron steering on Qwen3.5-4B \(32 layers, 9,216 neurons per layer, ~295K total\), describing the technique as adding a fixed &quot;dose&quot; to a single neuron during inference via a PyTorch forward pre-hook on the MLP down\_proj. The post specifies the addressing convention \(e.g., L11 N8147\), a scaling formula using median residual norms, practical dose ranges \(0.75–1.0 typical, &gt;1.5 often gibberish\), and notes that changes can be saved as control vectors for llama.cpp via --control-vector. Three discovery methods are outlined: random search, gradient-based shortlisting with an LLM judge, and activation mining, with caveats that most neurons yield uninteresting effects and polarity/dose tuning matters. The guide credits justinrhowell&\#x27;s neuron-steering repo for inspiration but provides no complete code, installation steps, or demonstrated behavior changes.

reddit · r/LocalLLaMA · /u/Tasty-Ad-3753 · Nov 9, 23:59

**「Why it matters」** Researchers and hobbyists exploring lightweight model steering can use this as a starting point to build a neuron-steering harness for Qwen3.5-4B; the first actionable step is to implement the described PyTorch hook and test random neurons at dose ±0.75 on middle layers while comparing outputs against a baseline.

**Tags**: `#neuron-steering`, `#activation-steering`, `#Qwen`, `#interpretability`, `#local-LLM`

---

## X / YouTube Highlights

<a id="item-social-hot-1"></a>
### [Complete GitHub Actions Course: Beginner to Pro](https://www.youtube.com/watch?v=Xwpi0ITkL3U) ⭐️ 8.0/10

This 3.7-hour complete GitHub Actions course from DevOps Directive takes viewers from beginner to advanced level, covering CI/CD workflow automation with practical, reproducible examples. The course includes a companion GitHub repository containing all sample workflows so learners can follow along in their own editor and build a mental model for GitHub Actions as a platform.

youtube · GitHub · Nov 10, 04:37

**「Why It&\#x27;s Hot」** This 3.7-hour GitHub Actions course from DevOps Directive has attracted 370,967 views, signaling strong developer demand for practical CI/CD automation skills. Viewers can walk away with reproducible workflow examples, best-practice patterns, and a structured path from basic syntax to advanced deployment pipelines they can apply directly to their projects.

<details><summary>References</summary>
<ul>
<li><a href="https://github.com/rashidbestry/devops-directive-github-actions">GitHub - rashidbestry/ devops - directive - github - actions : Companion...</a></li>
<li><a href="https://courses.devopsdirective.com/github-actions-beginner-to-pro/lessons/00-introduction/01-main">Technical courses by Sid Palas ( DevOps Directive )</a></li>

</ul>
</details>

**Tags**: `#GitHub Actions`, `#CI/CD`, `#DevOps`, `#教程`, `#自动化`

---