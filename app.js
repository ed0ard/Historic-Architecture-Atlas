/* ==========================================================================
   沙面·万国建筑地图
   Vanilla JS + Leaflet 1.9.4. All data is local; no backend, no API key.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Constants
     --------------------------------------------------------------------- */
  const CATEGORIES = {
    consulate: { label: "领事馆", color: "#1f3a5f" },
    bank: { label: "银行洋行", color: "#a67c34" },
    church: { label: "教堂", color: "#9b3d2e" },
    public: { label: "公共文化", color: "#1f4d3a" },
    hotel: { label: "酒店住宅", color: "#6b4a35" },
    military: { label: "军事警察", color: "#5b6266" },
    surrounding: { label: "周边关联", color: "#8a6a3b" },
  };

  const TYPE_COLORS = {
    建成: "#1f4d3a",
    事件: "#6b6258",
    灾害: "#a34a2a",
    收回: "#1f3a5f",
    保护: "#b08d57",
    修缮: "#7a6a53",
    建设: "#1f4d3a",
  };

  const YEAR_MIN = 1859;
  const YEAR_MAX = 2024;
  const SATELLITE_URL =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const ESRI_ATTRIBUTION =
    'Imagery &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>, Maxar, Earthstar Geographics';
  /* Central z19 detail grid, and the taller z18 coverage used to fill portrait
     viewports without letterboxing. */
  const DETAIL_BOUNDS = [
    [23.10373371, 113.23059082],
    [23.11573307, 113.25050354],
  ];
  const LOCAL_BASE_BOUNDS = [
    [23.07973176, 113.23059082],
    [23.14035999, 113.25119019],
  ];

  const STORIES = [
    {
      year: 1859,
      title: "沙洲变岛",
      text: "1859年，沙面开始填筑。迁走寮民、拆毁城防炮台，人工挖出宽约40米、长1200米的沙基涌，以花岗石砌筑堤岸。历时约两年，白鹅潭畔的沙洲变成一座人工岛。",
      focus: null,
      event: "e-1859",
      image: "./assets/img/historical/shameen-canal.webp",
      caption: "沙基涌与沙面堤岸，清末。公有领域。",
    },
    {
      year: 1861,
      title: "英法租约",
      text: "1861年9月3日，中英签订《沙面租约协定》；9月17日，中法签订租约。英国占西部约4/5，法国占东部约1/5。沙面由此成为广州城外的“国中之国”。",
      focus: null,
      event: "e-1861",
      image: "./assets/img/historical/shamian-1870s.webp",
      caption: "赖阿芳镜头下的沙面岛，1870年代。公有领域。",
    },
    {
      year: 1890,
      title: "露德圣母堂",
      text: "1890年，露德圣母堂建成，法国领事馆迁入沙面。哥特复兴式的尖券与玫瑰窗，成为法租界天际线上最清晰的一笔。",
      focus: "lourdes",
      event: "e-1890",
      image: "./assets/img/buildings/lourdes.webp",
      caption: "露德圣母堂正面，2023年。摄影：Inclavatura，CC BY-SA 4.0。",
    },
    {
      year: 1909,
      title: "东红楼",
      text: "1909年，粤海关俱乐部竣工。红砖清水墙、白色线脚与连续外廊，让“东红楼”成为沙面东端最醒目的地标，后来也作海关职员宿舍。",
      focus: "customs-club",
      event: "e-1909",
      image: "./assets/img/buildings/customs-club.webp",
      caption: "沙面大街2、4、6号红砖立面，2023年。摄影：Inclavatura，CC BY-SA 4.0。",
    },
    {
      year: 1946,
      title: "收回租界",
      text: "1946年，国民政府颁布收回沙面前英、法租界令。从1861年算起，85年的租界史落幕，沙面回到中国主权之下。",
      focus: "british-consulate",
      event: "e-1946",
      image: "./assets/img/buildings/british-consulate.webp",
      caption: "英国领事馆旧址沿江立面，2023年。摄影：古海岸遗址，CC BY-SA 4.0。",
    },
    {
      year: 1983,
      title: "白天鹅展翅",
      text: "1983年2月，白天鹅宾馆开业。改革开放后的第一家中外合作五星级酒店落户沙面，白鹅潭重新连接世界。",
      focus: "white-swan",
      event: "e-1983",
      image: "./assets/img/buildings/white-swan.webp",
      caption: "白天鹅宾馆主楼，2022年。摄影：中少，CC BY-SA 4.0。",
    },
    {
      year: 1996,
      title: "整岛国保",
      text: "1996年11月，沙面建筑群被列为第四批全国重点文物保护单位。整座岛不再只是二十几栋房子，而被当作一部近代建筑档案来保护。",
      focus: null,
      event: "e-1996",
      image: "./assets/img/historical/shameen-avenue-1880s.webp",
      caption: "沙面大街旧影，约1880年代。摄影：赖阿芳，公有领域。",
    },
    {
      year: 2024,
      title: "十号活化",
      text: "2023—2024年，沙面大街10号完成保护活化。从法国兵营到城市客厅，一栋建筑的去向，也是一座岛的当代答案。",
      focus: "shamian-10",
      event: "e-2024",
      image: "./assets/img/buildings/shamian-10.webp",
      caption: "沙面大街10、12号沿街立面，2023年。摄影：Inclavatura，CC BY-SA 4.0。",
    },
  ];

  /* ---------------------------------------------------------------------
     State
     --------------------------------------------------------------------- */
  const state = {
    year: YEAR_MAX,
    category: "all",
    selectedId: null,
    selectedEvent: null,
    playing: false,
    playTimer: null,
    storyIndex: 0,
    storyOpen: false,
    introOpen: true,
    islandBounds: null,
    layers: new Map(),
    events: [],
    credits: [],
    features: [],
    lastFocus: null,
    prevOverflow: "",
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const esc = (value) =>
    String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));

  const isMobile = () => window.matchMedia("(max-width: 600px)").matches;

  /* ---------------------------------------------------------------------
     Map bootstrap
     --------------------------------------------------------------------- */
  let map;
  let poiGroup;
  let islandLayer;
  let satelliteLayer = null;
  let satelliteAttribution = false;

  function initMap() {
    map = L.map("map", {
      center: [23.1098, 113.2405],
      zoom: 16,
      minZoom: 14,
      maxZoom: 19,
      zoomSnap: 0.5,
      zoomControl: false,
      preferCanvas: false,
      attributionControl: true,
      maxBounds: LOCAL_BASE_BOUNDS,
      maxBoundsViscosity: 1,
    });

    map.createPane("offlineBasePane");
    map.getPane("offlineBasePane").style.zIndex = 150;
    map.createPane("islandPane");
    map.getPane("islandPane").style.zIndex = 360;
    map.createPane("poiPane");
    map.getPane("poiPane").style.zIndex = 420;

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    /* Instant underlay: the stitched z19 master raster. The local tile pyramid
       above it supplies the crisp, container-filling background at every zoom. */
    L.imageOverlay("./assets/maps/shamian-osm-base.webp", DETAIL_BOUNDS, {
      pane: "offlineBasePane",
      opacity: 1,
      interactive: false,
      className: "offline-base",
      alt: "沙面离线 OSM 底图",
    }).addTo(map);

    /* Tall z16–z18 coverage fills portrait viewports; the central z16–z19
       layer supplies native detail on and around the island. Inset the tile
       bounds by a hair: the west edge sits exactly on a tile seam, and the
       off-screen buffered neighbour would otherwise 404. */
    const inset = 0.000001;
    const coverage = (bounds) => L.latLngBounds(
      [bounds[0][0] + inset, bounds[0][1] + inset],
      [bounds[1][0] - inset, bounds[1][1] - inset]
    );

    L.tileLayer("./assets/tiles/{z}/{x}_{y}.png", {
      minZoom: 14,
      maxZoom: 19,
      minNativeZoom: 16,
      maxNativeZoom: 18,
      bounds: coverage(LOCAL_BASE_BOUNDS),
      noWrap: true,
      keepBuffer: 4,
    }).addTo(map);

    L.tileLayer("./assets/tiles/{z}/{x}_{y}.png", {
      minZoom: 14,
      maxZoom: 19,
      minNativeZoom: 16,
      maxNativeZoom: 19,
      bounds: coverage(DETAIL_BOUNDS),
      noWrap: true,
      keepBuffer: 4,
    }).addTo(map);

    map.attributionControl.addAttribution(
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors · 本地瓦片'
    );

    poiGroup = L.layerGroup().addTo(map);

    map.on("click", () => {
      if (state.storyOpen) return;
      if (state.selectedId || state.selectedEvent) closeSelection();
    });

    document.querySelectorAll(".leaflet-control-attribution a").forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    });
  }

  /** Switch between the offline 2D OSM pyramid and Esri World Imagery. */
  function setBasemap(mode) {
    const useSatellite = mode === "satellite";
    if (useSatellite) {
      if (!satelliteLayer) {
        satelliteLayer = L.tileLayer(SATELLITE_URL, {
          minZoom: 14,
          maxZoom: 19,
          maxNativeZoom: 19,
          bounds: L.latLngBounds(LOCAL_BASE_BOUNDS),
          noWrap: true,
          keepBuffer: 4,
        });
      }
      if (!map.hasLayer(satelliteLayer)) satelliteLayer.addTo(map);
      if (!satelliteAttribution) {
        map.attributionControl.addAttribution(ESRI_ATTRIBUTION);
        satelliteAttribution = true;
      }
    } else {
      if (satelliteLayer && map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
      if (satelliteAttribution) {
        map.attributionControl.removeAttribution(ESRI_ATTRIBUTION);
        satelliteAttribution = false;
      }
    }
    $$(".basemap-btn").forEach((btn) => {
      const active = btn.dataset.basemap === (useSatellite ? "satellite" : "2d");
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function addIsland(islandGeo) {
    if (islandGeo && islandGeo.features && islandGeo.features.length) {
      islandLayer = L.geoJSON(islandGeo, {
        pane: "islandPane",
        interactive: false,
        style: {
          color: "#1f4d3a",
          weight: 1.4,
          opacity: 0.65,
          dashArray: "5 6",
          fillColor: "#1f4d3a",
          fillOpacity: 0.06,
        },
      }).addTo(map);
      state.islandBounds = islandLayer.getBounds();
    } else {
      const pts = state.features
        .filter((p) => p.properties.category !== "surrounding")
        .map((p) => p.properties.center);
      state.islandBounds = L.latLngBounds(pts).pad(0.15);
    }
  }

  /* ---------------------------------------------------------------------
     Building layers
     --------------------------------------------------------------------- */
  function baseStyle(props, selected) {
    const color = (CATEGORIES[props.category] || CATEGORIES.public).color;
    return {
      pane: "poiPane",
      color: selected ? "#1f2a26" : color,
      weight: selected ? 2.6 : 1.1,
      opacity: selected ? 1 : 0.92,
      fillColor: color,
      fillOpacity: selected ? 0.48 : 0.26,
      dashArray: props.category === "surrounding" ? "5 4" : null,
      lineJoin: "round",
    };
  }

  function addBuildings(features) {
    features.forEach((feature, index) => {
      const props = feature.properties;
      const number = index + 1;
      const color = (CATEGORIES[props.category] || CATEGORIES.public).color;
      let polygon = null;

      if (feature.geometry.type === "Polygon") {
        const ring = feature.geometry.coordinates[0].map(([lon, lat]) => [lat, lon]);
        polygon = L.polygon(ring, baseStyle(props, false));
        polygon.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          selectBuilding(props.id);
        });
        polygon.on("mouseover", () => {
          if (state.selectedId !== props.id) {
            polygon.setStyle({ weight: 1.9, fillOpacity: 0.4 });
          }
        });
        polygon.on("mouseout", () => {
          if (state.selectedId !== props.id) polygon.setStyle(baseStyle(props, false));
        });
      }

      const pinClass = props.category === "surrounding" ? "is-surrounding" : "";

      const icon = L.divIcon({
        className: "poi-marker",
        html: `<span class="pin ${pinClass}" style="--pin-color:${color}">${number}</span>`,
        iconSize: [25, 25],
        iconAnchor: [12.5, 12.5],
      });

      const marker = L.marker(props.center, {
        icon,
        title: props.name_zh,
        alt: props.name_zh,
        keyboard: true,
        riseOnHover: true,
      });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        selectBuilding(props.id);
      });
      marker.bindTooltip(
        `<b>${number} · ${esc(props.name_zh)}</b><span>${esc(props.built_label)}</span>`,
        { direction: "top", offset: [0, -12], className: "poi-tooltip", opacity: 1 }
      );

      state.layers.set(props.id, { props, polygon, marker, number, visible: true });
    });
  }

  function visibleByYear(props) {
    if (props.built_year != null) return props.built_year <= state.year;
    return state.year >= (props.visible_from || 1861);
  }

  function visibleByCategory(props) {
    return state.category === "all" || props.category === state.category;
  }

  function isRecordVisible(rec) {
    return visibleByYear(rec.props) && visibleByCategory(rec.props);
  }

  function refreshMap() {
    if (!poiGroup) return;
    let visible = 0;

    /* Diff visibility instead of clearing the group: rebuilding every marker
       on each timeline tick or reset makes the pins flicker. */
    state.layers.forEach((rec) => {
      const show = isRecordVisible(rec);
      rec.visible = show;

      if (rec.polygon) {
        const onMap = poiGroup.hasLayer(rec.polygon);
        if (show && !onMap) poiGroup.addLayer(rec.polygon);
        if (!show && onMap) poiGroup.removeLayer(rec.polygon);
        rec.polygon.setStyle(baseStyle(rec.props, rec.props.id === state.selectedId));
      }

      const markerOnMap = poiGroup.hasLayer(rec.marker);
      if (show && !markerOnMap) poiGroup.addLayer(rec.marker);
      if (!show && markerOnMap) poiGroup.removeLayer(rec.marker);
      if (show) visible += 1;

      const el = rec.marker.getElement();
      if (el) {
        el.classList.toggle("is-selected", rec.props.id === state.selectedId);
        el.classList.toggle("is-dim", !show);
      }
    });

    const hudYear = $("#hudYear");
    const hudCount = $("#hudCount");
    if (hudYear) hudYear.textContent = state.year;
    if (hudCount) hudCount.textContent = `${visible} / ${state.layers.size} 处`;

    const meta = $("#timelineMeta");
    if (meta) {
      meta.textContent = `已建成 ${visible} 处 · ${eventsUpTo().length} 件史事`;
    }
  }

  function updateSelectedStyles() {
    state.layers.forEach((rec) => {
      if (rec.polygon) rec.polygon.setStyle(baseStyle(rec.props, rec.props.id === state.selectedId));
      const el = rec.marker.getElement();
      if (el) el.classList.toggle("is-selected", rec.props.id === state.selectedId);
    });
    if (state.selectedId) {
      const rec = state.layers.get(state.selectedId);
      if (rec && rec.polygon && rec.polygon.bringToFront) rec.polygon.bringToFront();
    }
  }

  function flyToRecord(rec) {
    if (rec.polygon) {
      map.flyToBounds(rec.polygon.getBounds(), {
        padding: [44, 44],
        maxZoom: 18,
        duration: 0.75,
      });
    } else {
      map.flyTo(rec.props.center, 18, { duration: 0.75 });
    }
  }

  function fitIsland(animate) {
    if (!state.islandBounds) return;
    if (animate) {
      map.flyToBounds(state.islandBounds, { padding: [26, 26], duration: 0.6 });
    } else {
      map.fitBounds(state.islandBounds, { padding: [26, 26] });
    }
  }

  /** Keep panning inside the local tile coverage. */
  function updateBaseLimits() {
    if (!map) return;
    map.setMaxBounds(L.latLngBounds(LOCAL_BASE_BOUNDS));
  }

  /** Default view: every numbered POI, framed tightly. */
  function fitAllPois(animate) {
    if (!state.features.length) return;
    const points = state.features.map((f) => f.properties.center);
    const bounds = L.latLngBounds(points);
    const padding = isMobile() ? [10, 10] : [16, 16];
    if (!animate) {
      map.fitBounds(bounds, { padding, maxZoom: 18 });
      return;
    }
    /* setView's CSS zoom animation eases straight to the target. flyToBounds
       overshoots the destination zoom slightly before snapping back, which
       reads as a jolt when the map is reset from a close-up view. */
    const targetZoom = Math.min(18, map.getBoundsZoom(bounds, false, L.point(padding)));
    map.stop();
    map.setView(bounds.getCenter(), targetZoom, {
      animate: true,
      duration: 0.6,
    });
  }

  /** Allow one step out from the all-POI view; never show blank tile edges. */
  function setDefaultMinZoom() {
    if (!map) return;
    map.setMinZoom(Math.max(14, map.getZoom() - 0.5));
  }

  /* ---------------------------------------------------------------------
     Selection & archive views
     --------------------------------------------------------------------- */
  function selectBuilding(id, options) {
    const opts = options || {};
    const rec = state.layers.get(id);
    if (!rec) return;

    state.selectedId = id;
    state.selectedEvent = null;
    updateSelectedStyles();
    renderBuildingView(rec);

    if (opts.openPanel !== false) {
      showView("building");
      if (isMobile()) openDrawer();
    }
    if (opts.fly !== false) flyToRecord(rec);
    if (opts.closeStory) closeStory(false);
  }

  function closeSelection() {
    state.selectedId = null;
    state.selectedEvent = null;
    updateSelectedStyles();
    showView("home");
    renderHomeLists();
    if (state.storyOpen) return;
    fitAllPois(true);
    if (isMobile()) closeDrawer();
  }

  function showView(name) {
    const home = $("#archiveHome");
    const building = $("#buildingView");
    const event = $("#eventView");
    if (!home || !building || !event) return;
    home.hidden = name !== "home";
    building.hidden = name !== "building";
    event.hidden = name !== "event";
    const scroll = $("#archiveScroll");
    if (scroll) scroll.scrollTop = 0;
  }

  function imageFigure(img, name, extraClass) {
    const isPlaceholder = /\.svg($|\?)/i.test(img.src);
    const credit = esc(img.credit);
    const license = img.license
      ? img.license_url
        ? `<a href="${esc(img.license_url)}" target="_blank" rel="noopener">${esc(img.license)}</a>`
        : esc(img.license)
      : "";
    const source = img.source_url
      ? `<a href="${esc(img.source_url)}" target="_blank" rel="noopener">原始文件</a>`
      : "";
    const creditLine = [credit, license, source].filter(Boolean).join(" · ");

    return `<figure class="record-photo ${extraClass || ""}">
      <img src="${esc(img.src)}" alt="${esc(name)}" loading="lazy" class="${isPlaceholder ? "is-placeholder" : ""}"
        onerror="this.onerror=null;this.src='./assets/img/buildings/placeholder-generic.svg';this.classList.add('is-placeholder')">
      <figcaption><span>${esc(img.caption)}<br>${creditLine}</span></figcaption>
    </figure>`;
  }

  function renderBuildingView(rec) {
    const p = rec.props;
    const cat = CATEGORIES[p.category] || CATEGORIES.public;
    const view = $("#buildingView");
    if (!view) return;

    const notYet = p.built_year != null && p.built_year > state.year;
    const filteredOut = !visibleByCategory(p);

    const flags = [];
    if (p.category === "surrounding") flags.push('<span class="flag flag-surrounding">周边关联</span>');
    if (p.geometry_precision === "point") flags.push('<span class="flag">门牌定位</span>');
    if (notYet) flags.push('<span class="flag flag-notbuilt">当前年份尚未建成</span>');

    const events = p.events
      .map((id) => state.events.find((e) => e.id === id))
      .filter(Boolean);

    const eventChips = events.length
      ? events.map((e) => `<button class="event-chip" type="button" data-event="${esc(e.id)}"><b>${e.year}</b>${esc(e.title)}</button>`).join("")
      : '<span class="building-sub">暂无关联事件</span>';

    const sourceItems = (p.sources || []).map((s) => `<li>${esc(s)}</li>`).join("");

    let notice = "";
    if (notYet) {
      notice = `<div class="record-notice danger">当前时间切片为 ${state.year} 年，该建筑尚未建成。其在时间轴上的显示起始年为 ${p.built_year} 年。<button type="button" data-jump-year="${p.built_year}">跳到 ${p.built_year} 年</button></div>`;
    }
    if (filteredOut) {
      notice += `<div class="record-notice">当前筛选为“${esc(cat.label)}”以外的类别，该建筑暂不显示在地图上。<button type="button" data-reset-filter>重置筛选</button></div>`;
    }
    if (p.category === "surrounding") {
      notice += `<div class="record-notice">周边关联点，位于沙面岛外，用于连接粤海关与十三行贸易史。</div>`;
    }

    const secondary = p.images.length > 1 ? imageFigure(p.images[1], p.name_zh, "record-photo-secondary") : "";

    view.innerHTML = `
      <div class="view-top">
        <button class="back-btn" type="button" data-back>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
          返回档案目录
        </button>
        <span class="building-sub">No. ${String(rec.number).padStart(2, "0")}</span>
      </div>

      <div class="record-kicker" style="--record-color:${cat.color}">
        <span class="num ${p.category === "surrounding" ? "is-surrounding" : ""}">${rec.number}</span>
        <span>${esc(cat.label)}</span>
      </div>
      <h2 class="record-title">${esc(p.name_zh)}</h2>
      <p class="record-en">${esc(p.name_en)}</p>
      <div class="record-flags">${flags.join("")}</div>

      ${imageFigure(p.images[0], p.name_zh, "")}

      <table class="meta-table">
        <tbody>
          <tr><th>地址</th><td>${esc(p.address)}</td></tr>
          <tr><th>建成年代</th><td>${esc(p.built_label)}</td></tr>
          <tr><th>原用途</th><td>${esc(p.original_use)}</td></tr>
          <tr><th>现用途</th><td>${esc(p.current_use)}</td></tr>
          <tr><th>建筑风格</th><td>${esc(p.style)}</td></tr>
          <tr><th>保护级别</th><td>${esc(p.heritage_status)}</td></tr>
          <tr><th>建筑师</th><td>${esc(p.architect)}</td></tr>
          ${p.renovated && p.renovated.length ? `<tr><th>修缮</th><td>${esc(p.renovated.join("、"))}</td></tr>` : ""}
        </tbody>
      </table>

      <p class="record-summary">${esc(p.summary)}</p>
      ${notice}

      ${secondary}

      <div class="record-section">
        <h3>相关事件</h3>
        <div class="event-chips">${eventChips}</div>
      </div>

      <div class="record-section">
        <h3>资料来源</h3>
        <ul class="record-sources">${sourceItems}</ul>
      </div>

      <div class="record-actions">
        <button class="btn btn-ghost" type="button" data-fly="${esc(p.id)}">在地图上定位</button>
        <button class="btn btn-primary" type="button" data-back>关闭档案</button>
      </div>
    `;
  }

  function openEvent(id, options) {
    const opts = options || {};
    const ev = state.events.find((e) => e.id === id);
    if (!ev) return;

    state.selectedEvent = id;
    if (opts.setYear !== false) setYear(ev.year);

    if (ev.building_ids.length) {
      const first = state.layers.get(ev.building_ids[0]);
      if (first) {
        state.selectedId = first.props.id;
        updateSelectedStyles();
        renderBuildingView(first);
        if (opts.fly !== false) flyToRecord(first);
      }
    } else if (opts.fly !== false) {
      fitIsland(true);
    }

    renderEventView(ev);
    showView("event");
    if (isMobile()) openDrawer();
  }

  function renderEventView(ev) {
    const view = $("#eventView");
    if (!view) return;
    const buildings = ev.building_ids
      .map((id) => state.layers.get(id))
      .filter(Boolean)
      .map((rec) => `<button class="involved-btn" type="button" data-building="${esc(rec.props.id)}">${esc(rec.props.name_zh)}</button>`)
      .join("");

    view.innerHTML = `
      <div class="view-top">
        <button class="back-btn" type="button" data-back>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
          返回档案目录
        </button>
        <span class="type-badge type-${esc(ev.type)}">${esc(ev.type)}</span>
      </div>

      <div class="event-record">
        <p class="event-record-year">${ev.year}</p>
        <p class="event-record-date">${esc(ev.date_label)}</p>
        <h2>${esc(ev.title)}</h2>
        <p class="event-record-desc">${esc(ev.description)}</p>

        <div class="record-section">
          <h3>涉及建筑</h3>
          <div class="involved-list">${buildings || '<span class="building-sub">全岛性事件，未绑定单一建筑</span>'}</div>
        </div>

        <p class="event-record-source">来源：${esc(ev.source)}</p>

        <div class="record-actions">
          <button class="btn btn-ghost" type="button" data-back>返回目录</button>
          <button class="btn btn-primary" type="button" data-jump-year="${ev.year}">回到 ${ev.year} 年</button>
        </div>
      </div>
    `;
  }

  /* ---------------------------------------------------------------------
     Home lists
     --------------------------------------------------------------------- */
  function eventsUpTo() {
    return state.events.filter((e) => e.year <= state.year);
  }

  function renderHomeLists() {
    if (!state.features.length) return;

    const evs = eventsUpTo();
    const eventList = $("#eventList");
    const buildingList = $("#buildingList");
    const eventCount = $("#eventCountLabel");
    const buildingCount = $("#buildingCountLabel");

    if (eventCount) eventCount.textContent = `${evs.length} 件`;

    if (eventList) {
      eventList.innerHTML = evs.length
        ? evs.map((e) => `
          <button class="event-item" type="button" data-event="${esc(e.id)}">
            <span class="event-year">${e.year}</span>
            <span class="event-main">
              <span class="event-title"><span class="type-badge type-${esc(e.type)}">${esc(e.type)}</span>${esc(e.title)}</span>
              <span class="event-sub">${esc(e.date_label)} · ${e.building_ids.length ? `${e.building_ids.length} 处建筑` : "全岛性事件"}</span>
            </span>
          </button>`).join("")
        : '<p class="empty-note">该年份之前暂无记录。</p>';
    }

    const recs = Array.from(state.layers.values())
      .filter(isRecordVisible)
      .sort((a, b) => a.number - b.number);

    if (buildingCount) buildingCount.textContent = `${recs.length} 处`;

    if (buildingList) {
      buildingList.innerHTML = recs.length
        ? recs.map((rec) => {
          const p = rec.props;
          const cat = CATEGORIES[p.category] || CATEGORIES.public;
          return `<button class="building-item" type="button" data-building="${esc(p.id)}">
            <span class="building-num ${p.category === "surrounding" ? "is-surrounding" : ""}" style="--item-color:${cat.color}">${rec.number}</span>
            <span>
              <span class="building-name">${esc(p.name_zh)}</span>
              <span class="building-sub">${esc(cat.label)} · ${esc(p.address)}</span>
            </span>
            <span class="building-year">${esc(p.built_label)}</span>
          </button>`;
        }).join("")
        : '<p class="empty-note">该年份与筛选条件下暂无建筑。试试拖动时间轴或重置筛选。</p>';
    }
  }

  /* ---------------------------------------------------------------------
     Timeline
     --------------------------------------------------------------------- */
  function setYear(year, options) {
    const opts = options || {};
    const next = Math.max(YEAR_MIN, Math.min(YEAR_MAX, Number(year)));
    state.year = next;

    const range = $("#yearRange");
    if (range) range.value = String(next);
    const label = $("#yearLabel");
    if (label) label.textContent = String(next);
    const hud = $("#hudYear");
    if (hud) hud.textContent = String(next);

    const pct = ((next - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100;
    if (range) range.style.setProperty("--progress", `${pct}%`);

    updateTicks();
    refreshMap();
    renderHomeLists();

    if (state.selectedId) {
      const rec = state.layers.get(state.selectedId);
      if (rec) renderBuildingView(rec);
    }

    if (opts.pausePlay !== false) stopPlay();
  }

  function renderTicks() {
    const ticks = $("#ticks");
    if (!ticks) return;
    ticks.innerHTML = "";
    const span = YEAR_MAX - YEAR_MIN;

    state.events.forEach((ev, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tick";
      btn.style.left = `${((ev.year - YEAR_MIN) / span) * 100}%`;
      btn.style.setProperty("--tick-color", TYPE_COLORS[ev.type] || "#a34a2a");
      btn.style.setProperty("--tier", `${(index % 2) * 6}px`);
      btn.title = `${ev.year} · ${ev.title}`;
      btn.setAttribute("aria-label", `${ev.year}年，${ev.title}`);
      btn.dataset.event = ev.id;
      btn.addEventListener("click", () => openEvent(ev.id));
      ticks.appendChild(btn);
    });
    updateTicks();
  }

  function updateTicks() {
    $$("#ticks .tick").forEach((btn) => {
      const ev = state.events.find((e) => e.id === btn.dataset.event);
      if (!ev) return;
      btn.classList.toggle("is-past", ev.year <= state.year);
      btn.classList.toggle("is-future", ev.year > state.year);
    });
  }

  /** Years in which the map or the event list actually changes. */
  function changeYears() {
    const years = new Set([YEAR_MIN, YEAR_MAX]);
    state.events.forEach((ev) => {
      if (ev.year >= YEAR_MIN && ev.year <= YEAR_MAX) years.add(ev.year);
    });
    state.layers.forEach((rec) => {
      const p = rec.props;
      const y = p.built_year != null ? p.built_year : p.visible_from;
      if (y != null && y >= YEAR_MIN && y <= YEAR_MAX) years.add(y);
    });
    return Array.from(years).sort((a, b) => a - b);
  }

  function startPlay() {
    if (state.playing) return;
    if (state.storyOpen) closeStory(false);
    if (state.year >= YEAR_MAX) setYear(YEAR_MIN, { pausePlay: false });

    /* Playback skips uneventful years. If the reader has dragged to a year
       between changes, jump to the next change first, then continue. */
    const targets = changeYears().filter((y) => y >= state.year);
    if (!targets.length) return;
    if (targets[0] !== state.year) setYear(targets[0], { pausePlay: false });
    let index = targets.indexOf(state.year);
    if (index < 0) index = 0;

    state.playing = true;
    const btn = $("#playBtn");
    if (btn) {
      btn.classList.add("is-playing");
      btn.setAttribute("aria-label", "暂停时间轴");
    }
    state.playTimer = window.setInterval(() => {
      const next = targets[index + 1];
      if (next == null) {
        stopPlay();
        return;
      }
      index += 1;
      setYear(next, { pausePlay: false });
    }, 900);
  }

  function stopPlay() {
    if (!state.playing && !state.playTimer) return;
    state.playing = false;
    if (state.playTimer) window.clearInterval(state.playTimer);
    state.playTimer = null;
    const btn = $("#playBtn");
    if (btn) {
      btn.classList.remove("is-playing");
      btn.setAttribute("aria-label", "播放时间轴（跳转有变化年份）");
    }
  }

  function togglePlay() {
    if (state.playing) stopPlay();
    else startPlay();
  }

  /* ---------------------------------------------------------------------
     Story mode
     --------------------------------------------------------------------- */
  function openStory() {
    if (state.introOpen) dismissIntro(true);
    stopPlay();
    closeDrawer();
    state.storyOpen = true;
    state.storyIndex = 0;
    const story = $("#story");
    if (story) story.hidden = false;
    renderStoryDots();
    renderStory(0);
  }

  function closeStory(showHome) {
    state.storyOpen = false;
    const story = $("#story");
    if (story) story.hidden = true;
    if (showHome !== false) {
      showView("home");
      renderHomeLists();
    }
  }

  function renderStoryDots() {
    const wrap = $("#storyProgress");
    if (!wrap) return;
    wrap.innerHTML = STORIES.map((s, i) =>
      `<button class="story-dot" type="button" data-story="${i}" aria-label="第 ${i + 1} 步：${esc(s.title)}"></button>`
    ).join("");
  }

  function renderStory(index) {
    const i = Math.max(0, Math.min(STORIES.length - 1, index));
    state.storyIndex = i;
    const s = STORIES[i];

    const idx = $("#storyIndex");
    const year = $("#storyYear");
    const title = $("#storyTitle");
    const text = $("#storyText");
    const image = $("#storyImage");
    const caption = $("#storyCaption");
    const figure = $("#storyFigure");
    if (figure) figure.hidden = false;
    if (idx) idx.textContent = String(i + 1).padStart(2, "0");
    if (year) year.textContent = String(s.year);
    if (title) title.textContent = s.title;
    if (text) text.textContent = s.text;
    if (image) {
      image.src = s.image;
      image.alt = s.title;
      image.onerror = () => {
        if (figure) figure.hidden = true;
      };
    }
    if (caption) caption.textContent = s.caption;

    $$("#storyProgress .story-dot").forEach((dot, di) => {
      dot.classList.toggle("is-active", di === i);
      dot.setAttribute("aria-current", di === i ? "step" : "false");
    });

    const prev = $("#storyPrev");
    const next = $("#storyNext");
    if (prev) prev.disabled = i === 0;
    if (next) next.querySelector("span").textContent = i === STORIES.length - 1 ? "完成" : "下一步";

    setYear(s.year, { pausePlay: false });

    if (s.focus) {
      const rec = state.layers.get(s.focus);
      if (rec) {
        state.selectedId = s.focus;
        state.selectedEvent = null;
        updateSelectedStyles();
        renderBuildingView(rec);
        flyToRecord(rec);
      }
    } else {
      state.selectedId = null;
      state.selectedEvent = null;
      updateSelectedStyles();
      fitIsland(true);
    }
  }

  function storyStep(delta) {
    const next = state.storyIndex + delta;
    if (next < 0) return;
    if (next >= STORIES.length) {
      const last = STORIES[STORIES.length - 1];
      closeStory(false);
      if (last.focus) selectBuilding(last.focus);
      return;
    }
    renderStory(next);
  }

  /* ---------------------------------------------------------------------
     Intro, drawer, layer panel, modal
     --------------------------------------------------------------------- */
  function dismissIntro(immediate) {
    if (!state.introOpen) return;
    state.introOpen = false;
    const shell = $("#appShell");
    if (shell) shell.removeAttribute("inert");
    const intro = $("#intro");
    if (!intro) return;
    if (immediate) {
      intro.hidden = true;
      if (map) map.invalidateSize();
      return;
    }
    intro.classList.add("is-closing");
    window.setTimeout(() => {
      intro.hidden = true;
      intro.classList.remove("is-closing");
      if (map) map.invalidateSize();
      updateBaseLimits();
      fitAllPois(false);
      setDefaultMinZoom();
    }, 360);
  }

  function openDrawer() {
    if (!isMobile()) return;
    const archive = $("#archive");
    if (archive) archive.classList.add("is-open");
  }

  function closeDrawer() {
    const archive = $("#archive");
    if (archive) archive.classList.remove("is-open");
  }

  function toggleDrawer() {
    if (!isMobile()) return;
    const archive = $("#archive");
    if (!archive) return;
    archive.classList.toggle("is-open");
  }

  function openSources() {
    const modal = $("#sourcesModal");
    if (!modal) return;
    state.lastFocus = document.activeElement;
    state.prevOverflow = document.body.style.overflow;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const close = $("#sourcesClose");
    if (close) close.focus();
  }

  function closeSources() {
    const modal = $("#sourcesModal");
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = state.prevOverflow || "";
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }

  /** Count unique photos actually referenced by the archive and story mode. */
  function updatePhotoStat() {
    const el = $("#photoStat");
    if (!el) return;
    const photos = new Set();
    const add = (img) => {
      const src = typeof img === "string" ? img : img && img.src;
      if (src && !/\.svg($|\?)/i.test(src)) photos.add(src);
    };
    state.features.forEach((f) => (f.properties.images || []).forEach(add));
    STORIES.forEach((story) => add(story.image));
    el.textContent = String(photos.size);
  }

  function renderCredits() {
    const list = $("#creditList");
    const count = $("#creditCount");
    if (!list) return;
    if (count) count.textContent = `（${state.credits.length} 项）`;

    const sorted = state.credits.slice().sort((a, b) => {
      const ua = a.used_for || "";
      const ub = b.used_for || "";
      return ua.localeCompare(ub, "zh-Hans") || a.title.localeCompare(b.title, "zh-Hans");
    });

    list.innerHTML = sorted.map((c) => {
      const license = c.license
        ? c.license_url
          ? `<a href="${esc(c.license_url)}" target="_blank" rel="noopener">${esc(c.license)}</a>`
          : esc(c.license)
        : "";
      const source = c.source_url
        ? `<a href="${esc(c.source_url)}" target="_blank" rel="noopener">原始文件</a>`
        : "";
      const meta = [esc(c.credit), license, source].filter(Boolean).join(" · ");
      return `<div class="credit-item">
        <img class="credit-thumb" src="${esc(c.src)}" alt="${esc(c.title)}" loading="lazy"
          onerror="this.style.visibility='hidden'">
        <div>
          <p class="credit-title">${esc(c.title)}</p>
          <p class="credit-meta">用于：${esc(c.used_for)}<br>${meta}</p>
        </div>
      </div>`;
    }).join("");
  }

  function syncCategoryChips() {
    $$(".chip[data-category]").forEach((chip) => {
      const active = chip.dataset.category === state.category;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
  }

  /** Return to the full 1859—2024, unfiltered overview in one eased move. */
  function resetView() {
    stopPlay();
    closeStory(false);
    if (map) map.stop();

    const categoryChanged = state.category !== "all";
    const yearChanged = state.year !== YEAR_MAX;
    const hadSelection = Boolean(state.selectedId || state.selectedEvent);

    state.category = "all";
    state.selectedId = null;
    state.selectedEvent = null;
    syncCategoryChips();
    if (hadSelection) updateSelectedStyles();

    if (yearChanged) {
      setYear(YEAR_MAX, { pausePlay: false });
    } else if (categoryChanged) {
      refreshMap();
      renderHomeLists();
    }

    showView("home");
    fitAllPois(true);
  }

  /* ---------------------------------------------------------------------
     Events / binding
     --------------------------------------------------------------------- */
  function bindUI() {
    const startBtn = $("#startBtn");
    if (startBtn) startBtn.addEventListener("click", () => dismissIntro(false));

    const storyBtn = $("#storyBtn");
    if (storyBtn) {
      storyBtn.addEventListener("click", () => {
        if (state.storyOpen) closeStory(true);
        else openStory();
      });
    }
    const storyClose = $("#storyClose");
    if (storyClose) storyClose.addEventListener("click", () => closeStory(true));
    const storyPrev = $("#storyPrev");
    if (storyPrev) storyPrev.addEventListener("click", () => storyStep(-1));
    const storyNext = $("#storyNext");
    if (storyNext) storyNext.addEventListener("click", () => storyStep(1));
    const storyProgress = $("#storyProgress");
    if (storyProgress) {
      storyProgress.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-story]");
        if (btn) renderStory(Number(btn.dataset.story));
      });
    }

    const sourcesBtn = $("#sourcesBtn");
    if (sourcesBtn) sourcesBtn.addEventListener("click", openSources);
    const sourcesClose = $("#sourcesClose");
    if (sourcesClose) sourcesClose.addEventListener("click", closeSources);
    const modal = $("#sourcesModal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeSources();
      });
    }

    const resetBtn = $("#resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", resetView);
    }

    const playBtn = $("#playBtn");
    if (playBtn) playBtn.addEventListener("click", togglePlay);

    const range = $("#yearRange");
    if (range) {
      range.addEventListener("input", () => {
        if (state.storyOpen) closeStory(false);
        setYear(Number(range.value));
      });
    }

    const filterBar = $("#filterBar");
    if (filterBar) {
      filterBar.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip[data-category]");
        if (!chip) return;
        state.category = chip.dataset.category;
        $$(".chip[data-category]").forEach((c) => {
          const active = c === chip;
          c.classList.toggle("is-active", active);
          c.setAttribute("aria-pressed", String(active));
        });
        refreshMap();
        renderHomeLists();
        if (state.selectedId) {
          const rec = state.layers.get(state.selectedId);
          if (rec) renderBuildingView(rec);
        }
      });
    }

    const basemapSwitch = $("#basemapSwitch");
    if (basemapSwitch) {
      basemapSwitch.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-basemap]");
        if (btn) setBasemap(btn.dataset.basemap);
      });
    }

    const drawerHandle = $("#drawerHandle");
    if (drawerHandle) {
      drawerHandle.addEventListener("click", toggleDrawer);
      drawerHandle.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleDrawer();
        }
      });
    }

    const home = $("#archiveHome");
    if (home) {
      home.addEventListener("click", (e) => {
        const eventBtn = e.target.closest("[data-event]");
        if (eventBtn) {
          openEvent(eventBtn.dataset.event);
          return;
        }
        const buildingBtn = e.target.closest("[data-building]");
        if (buildingBtn) selectBuilding(buildingBtn.dataset.building);
      });
    }

    const buildingView = $("#buildingView");
    if (buildingView) {
      buildingView.addEventListener("click", (e) => {
        if (e.target.closest("[data-back]")) {
          closeSelection();
          return;
        }
        if (e.target.closest("[data-fly]")) {
          const rec = state.layers.get(state.selectedId);
          if (rec) flyToRecord(rec);
          return;
        }
        const jump = e.target.closest("[data-jump-year]");
        if (jump) {
          setYear(Number(jump.dataset.jumpYear));
          return;
        }
        if (e.target.closest("[data-reset-filter]")) {
          state.category = "all";
          $$(".chip[data-category]").forEach((c) => {
            const active = c.dataset.category === "all";
            c.classList.toggle("is-active", active);
            c.setAttribute("aria-pressed", String(active));
          });
          refreshMap();
          renderHomeLists();
          return;
        }
        const eventChip = e.target.closest("[data-event]");
        if (eventChip) openEvent(eventChip.dataset.event);
      });
    }

    const eventView = $("#eventView");
    if (eventView) {
      eventView.addEventListener("click", (e) => {
        if (e.target.closest("[data-back]")) {
          closeSelection();
          return;
        }
        const jump = e.target.closest("[data-jump-year]");
        if (jump) {
          setYear(Number(jump.dataset.jumpYear));
          return;
        }
        const buildingBtn = e.target.closest("[data-building]");
        if (buildingBtn) selectBuilding(buildingBtn.dataset.building);
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const modal = $("#sourcesModal");
        if (modal && !modal.hidden) {
          closeSources();
        } else if (state.storyOpen) {
          closeStory(true);
        } else if (state.selectedId || state.selectedEvent) {
          closeSelection();
        } else if (state.introOpen) {
          dismissIntro(false);
        }
        return;
      }
      if (!state.storyOpen) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "ArrowLeft") storyStep(-1);
      if (e.key === "ArrowRight") storyStep(1);
    });

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (map) map.invalidateSize();
        updateBaseLimits();
        if (window.innerWidth > 900) {
          const legend = $("#legend");
          if (legend) legend.setAttribute("open", "");
        }
      }, 180);
    });
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  async function loadJSON(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function boot() {
    bindUI();
    initMap();

    const [buildings, events, credits] = await Promise.all([
      loadJSON("./data/buildings.geojson"),
      loadJSON("./data/events.json"),
      loadJSON("./data/credits.json"),
    ]);
    let island = null;
    try {
      island = await loadJSON("./data/island.geojson");
    } catch (err) {
      console.warn("island.geojson unavailable; using building bounds.", err);
    }

    state.events = events;
    state.credits = credits;
    state.features = buildings.features;

    addIsland(island);
    addBuildings(buildings.features);
    renderTicks();
    renderCredits();
    updatePhotoStat();

    if (window.innerWidth <= 900) {
      const legend = $("#legend");
      if (legend) legend.removeAttribute("open");
    }

    const params = new URLSearchParams(window.location.search);
    const requestedYear = Number(params.get("year"));
    const startYear = Number.isFinite(requestedYear) && requestedYear >= YEAR_MIN && requestedYear <= YEAR_MAX
      ? requestedYear
      : YEAR_MAX;

    setYear(startYear, { pausePlay: false });
    updateBaseLimits();
    fitAllPois(false);
    setDefaultMinZoom();
    showView("home");

    /* The intro covers the map until the reader chooses to enter.
       ?intro=0 is a convenience for local review / screenshots. */
    const intro = $("#intro");
    if (params.get("intro") === "0") {
      dismissIntro(true);
      if (map) map.invalidateSize();
      updateBaseLimits();
      fitAllPois(false);
      setDefaultMinZoom();
    } else if (intro) {
      intro.hidden = false;
    }

    /* Optional deep links for review and teaching:
       ?year=1890&select=shamian-10, ?event=e-1946, ?story=1 */
    const selectId = params.get("select");
    if (selectId && state.layers.has(selectId)) {
      selectBuilding(selectId, { openPanel: true, fly: true });
    }
    const eventId = params.get("event");
    if (eventId) openEvent(eventId, { setYear: true, fly: true });
    if (params.get("story") === "1") openStory();
    if (params.get("play") === "1") startPlay();
    if (params.get("basemap") === "satellite") setBasemap("satellite");
    if (params.get("sources") === "1") openSources();
  }

  window.addEventListener("DOMContentLoaded", () => {
    boot().catch((err) => {
      console.error(err);
      const home = $("#archiveHome");
      if (home) {
        home.innerHTML = `<div class="panel-heading"><p class="eyebrow">Shamian Archive</p><h2>数据未能加载</h2></div>
          <div class="record-notice danger">页面未能读取本地数据。请通过本地 HTTP 服务器打开，而不是直接双击 <code>index.html</code>：<br><br>
          <code>python -m http.server 8000</code><br>
          然后访问 <code>http://localhost:8000/</code>。</div>`;
      }
      const intro = $("#intro");
      if (intro) intro.hidden = true;
    });
  });
})();

