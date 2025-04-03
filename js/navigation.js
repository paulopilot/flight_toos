/* navigation.js
   Funções genéricas de navegação, cálculos, parse de coordenadas e acesso à API.
*/

// Constantes para os parâmetros da API
const API_KEY = "2025912383";
const API_PASS = "e8a8940a-7120-11ee-a2b8-0050569ac2e1";

// URLs base
const BASE_URL_DEFAULT = "http://aisweb.decea.gov.br/api/?";
const BASE_URL_ROTAER = "http://api.decea.mil.br/aisweb/?";

/**
 * Todo IFR é VFR
 * 
 * WP-XXYYUU
 * 
 * Aerodromos
 * WP-ADIFPB.png 	- AD-IFR PUB 		[IFR/VFR]
 * WP-ADIFPBMI.png 	- AD-IFR PUB/MIL	[IFR/VFR]
 * WP-ADIFPV.png 	- AD-IFR PRIV 		[IFR/VFR]
 * WP-ADVIMI.png 	- AD-MIL  			[IFR/VFR]
 * WP-ADVIPB.png 	- AD-VFR PUB		[VFR]
 * WP-ADVIPV.png 	- AD-VFR PRIV		[VFR]
 * 
 * Heliponto/Helideck
 * WP-HPIFPB.png 	- HP-IFR PUB		[IFR/VFR]
 * WP-HPIFPBPV.png 	- HP-IFR PUB/PRIV	[IFR/VFR]
 * WP-HPIFPV.png	- HP-IFR PRIV		[IFR/VFR]
 * WP-HPVIPB.png	- HP-VFR PUB		[VFR]
 * WP-HPVIPV.png	- HP-VFR PRIV		[VFR]
 * WP-HPIFPBPV.png	- HP-VFR PUB/PRIV	[VFR]
 * 
 */


const WaypointType = Object.freeze({
	0: "AIRPORT",
	1: "HELIPOINT",
	2: "HELIDECK",
	3: "FIXES",
	4: "USER",
	AIRPORT: 0,
	HELIPOINT: 1,
	HELDECK: 2,
	FIXES: 3,
	USER: 4
});

// Usamos apenas para mapear o valor do XML
const AdType = Object.freeze({
	AD: 'AD',  // Aerodrome
	HP: 'HP',  // Helipoint
	HD: 'HD'   // Helideck
});

// Flags para operações
const OperationFlags = Object.freeze({
	VFR:  1 << 0,  // 1
	IFR:  1 << 1   // 2
});

// Flags para user
const UserFlags = Object.freeze({ 
	PRIV: 1 << 0,  // 1
	PUB: 1 << 1,   // 2
	MIL: 1 << 2    // 4
});

function getWpUser(user) {
	const types = [];
	if (user & UserFlags.PUB) {
	  types.push("PUB");
	}
	if (user & UserFlags.MIL) {
	  types.push("MIL");
	}
	if (user & UserFlags.PRIV) {
	  types.push("PRIV");
	}
	return types.join("/");
  }
  
  function getWpOper(oper) {
	const ops = [];
	if (oper & OperationFlags.IFR) {
	  ops.push("IFR");
	}
	if (oper & OperationFlags.VFR) {
	  ops.push("VFR");
	}
	return ops.join("/");
  }
  

// Mapeamento para converter o valor do AdType em WaypointType
const waypointTypeMapping = {
	[AdType.AD]: WaypointType.AIRPORT,
	[AdType.HP]: WaypointType.HELIPOINT,
	[AdType.HD]: WaypointType.HELIDECK
};

/**
 * Converte um par de coordendas geográficas para o formato DMS
 * 
 * @param {number} lat 
 * @param {number} lng 
 * @returns {lat, lng} in DMS format
 */
 function decimalToDMS(lat, lng) {
	// Converte a latitude
	const latAbs = Math.abs(lat);
	const latDeg = Math.floor(latAbs);
	const latMin = Math.floor((latAbs - latDeg) * 60);
	const latSec = (((latAbs - latDeg) * 60) - latMin) * 60;
	const latHemisphere = lat >= 0 ? "N" : "S";
	
	// Converte a longitude
	const lngAbs = Math.abs(lng);
	const lngDeg = Math.floor(lngAbs);
	const lngMin = Math.floor((lngAbs - lngDeg) * 60);
	const lngSec = (((lngAbs - lngDeg) * 60) - lngMin) * 60;
	const lngHemisphere = lng >= 0 ? "E" : "W";
  
	return {
	  lat: `${latDeg}°${latMin}'${latSec.toFixed(2)}" ${latHemisphere}`,
	  lng: `${lngDeg}°${lngMin}'${lngSec.toFixed(2)}" ${lngHemisphere}`
	};
  }

/**
 * Converte o par de coordenadas geográficas em um string no formato DMS
 * 
 * @param {number} lat 
 * @param {number} lng 
 * @returns string ddmmssN/SdddmmssE/W
 */
function decimalToDMSString(lat, lng) {
	// Processa a latitude
	let latAbs = Math.abs(lat);
	let latDeg = Math.floor(latAbs);
	let latMin = Math.floor((latAbs - latDeg) * 60);
	let latSec = Math.round((((latAbs - latDeg) * 60) - latMin) * 60);
  
	// Ajusta se os segundos arredondados forem 60
	if (latSec === 60) {
	  latSec = 0;
	  latMin += 1;
	}
	if (latMin === 60) {
	  latMin = 0;
	  latDeg += 1;
	}
	const latHemisphere = lat >= 0 ? "N" : "S";
  
	// Processa a longitude
	let lngAbs = Math.abs(lng);
	let lngDeg = Math.floor(lngAbs);
	let lngMin = Math.floor((lngAbs - lngDeg) * 60);
	let lngSec = Math.round((((lngAbs - lngDeg) * 60) - lngMin) * 60);
  
	if (lngSec === 60) {
	  lngSec = 0;
	  lngMin += 1;
	}
	if (lngMin === 60) {
	  lngMin = 0;
	  lngDeg += 1;
	}
	const lngHemisphere = lng >= 0 ? "E" : "W";
  
	// Formata com zeros à esquerda: latitude deve ter 2 dígitos e longitude 3
	const latDegStr = latDeg.toString().padStart(2, '0');
	const latMinStr = latMin.toString().padStart(2, '0');
	const latSecStr = latSec.toString().padStart(2, '0');
  
	const lngDegStr = lngDeg.toString().padStart(3, '0');
	const lngMinStr = lngMin.toString().padStart(2, '0');
	const lngSecStr = lngSec.toString().padStart(2, '0');
  
	return `${latDegStr}${latMinStr}${latSecStr}${latHemisphere}${lngDegStr}${lngMinStr}${lngSecStr}${lngHemisphere}`;
  }
/**
 * Obtém a declinação magnética (em graus) da NOAA, dado lat, lon e data.
 * Se houver erro, retorna 0 (ou null, se preferir).
 *
 * @param {number} lat
 * @param {number} lon
 * @param {Date} dateObj
 * @returns {Promise<number>} declinação em graus (pode ser negativa), ou 0 em caso de erro
 */
async function getMagneticDeclination(lat, lon, dateObj) {
    const year = dateObj.getFullYear();
    // OBS: getMonth() retorna 0 a 11, então +1 para obter o mês real
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
  
    // Endpoint e parâmetros da NOAA
    const baseUrl = 'https://www.ngdc.noaa.gov/geomag-web/calculators/calculateDeclination';
    const params = `?lat1=${lat}&lon1=${lon}&key=zNEw7&resultFormat=json&startYear=${year}&startMonth=${month}&startDay=${day}`;

    try {
        const response = await fetch(baseUrl + params);
        
        if (!response.ok) {
            console.error('Erro na resposta da NOAA:', response.status);
            return 0;
        }
        
        const data = await response.json();
        
        // O objeto JSON deve conter data.result[0].declination
        const declination = data?.result?.[0]?.declination;
        if (declination === undefined) {
            console.error('Declinação não encontrada no retorno da NOAA:', data);
            return 0;
        }
    
        return declination; // Pode ser positivo ou negativo
    } catch (error) {
        console.error('Erro ao buscar declinação magnética:', error);
        return 0;
    }
}

function getImgFileName(waypoint) {
	let fileName = "WP-";
	
	// Tipo do waypoint:
	if (waypoint.type == WaypointType.FIXES){
		fileName += "FIXES";
	}

	if (waypoint.type == WaypointType.USER){
		fileName += "USER";
	}

	// "AD" se for aeroporto, "HP" se for heliponto ou helideck
	if (waypoint.type === WaypointType.AIRPORT) {
	  fileName += "AD";
	} else {
		if (waypoint.type === WaypointType.HELIPOINT || waypoint.type === WaypointType.HELIDECK) {
	  		fileName += "HP";
		} 
	}

	if (waypoint.type === WaypointType.AIRPORT || waypoint.type === WaypointType.HELIPOINT || waypoint.type === WaypointType.HELIDECK) {
	
		// Tipo de operação:
		// Se a flag IFR estiver ativa (mesmo que VFR também esteja), usamos "IF"
		// Caso contrário, se só tiver VFR, usamos "VI"
		if (waypoint.oper & OperationFlags.IFR) {
		fileName += "IF";
		} else {
		fileName += "VI";
		}
		
		// Tipo de uso (user):
		// Ordem: PUBLICO ("PB"), MILITAR ("MI") e PRIVADO ("PV")
		// Caso haja mais de um, concatena em sequência.
		if (waypoint.user & UserFlags.PUB) {
		fileName += "PB";
		}
		if (waypoint.user & UserFlags.MIL) {
		fileName += "MI";
		}
		if (waypoint.user & UserFlags.PRIV) {
		fileName += "PV";
		}
	}
	
	fileName += ".png";
	return fileName;
  }


/**
 * Faz a requisição para a API DECEA, que retorna XML com informações do aeroporto
 * @param {string} icao - Código ICAO (ex: "SNIG")
 * @returns {Promise<Object|null>} Retorna um objeto "waypoint" com:
 *   ident, name, city, uf, lat, lng, altFt
 * 
 * type 
 * 		AD - Airport
 *      HP - Helipoint
 *      HD - Helideck
 * typeUtil
 *      MIL - Military
 *      PRIV - Private
 *      PUB - Public
 *      PUB/MIL - Public/Military
 *      PRIV/PUB - Private/Public
 * typeOpr
 * 		VFR
 * 		IFR
 */
async function getAirport(icao) {
	const url = `https://api.decea.mil.br/aisweb/?apiKey=2025912383&apiPass=e8a8940a-7120-11ee-a2b8-0050569ac2e1&area=rotaer&icaoCode=${icao}`;

	try {
		const response = await fetch(url);
		const xmlStr = await response.text();
		const xmlDoc = new DOMParser().parseFromString(xmlStr, "text/xml");
	
		// Elementos principais
		const aeroCodeTag = xmlDoc.querySelector("AeroCode");
		const nameTag = xmlDoc.querySelector("name");
		const cityTag = xmlDoc.querySelector("city");
		const ufTag = xmlDoc.querySelector("uf");
		const latTag = xmlDoc.querySelector("lat");
		const lngTag = xmlDoc.querySelector("lng");
		const altFtTag = xmlDoc.querySelector("altFt");
		
		// Seleciona o <type> que é filho direto do elemento raiz (<aisweb>)
		const typeTag = xmlDoc.documentElement.querySelector(":scope > type");
		const xmlAdType = typeTag ? typeTag.textContent.trim() : null;
		
		// Obtém o valor de typeOpr do XML
		const typeOprTag = xmlDoc.documentElement.querySelector(":scope > typeOpr");
		const typeOprText = typeOprTag ? typeOprTag.textContent.trim() : '';
		
		// Obtém o valor de typeUtil para compor as flags do "user"
		const typeUtilTag = xmlDoc.documentElement.querySelector(":scope > typeUtil");
		const xmlTypeUtil = typeUtilTag ? typeUtilTag.textContent.trim() : '';
	
		if (!aeroCodeTag || !nameTag || !cityTag || !ufTag || !latTag || !lngTag || !altFtTag) {
			return null;
		}
	
		// Mapeia o valor do XML para o AdType; se não encontrar, define padrão AD
		const adTypeValue = AdType[xmlAdType] || AdType.AD;
		// Mapeia o ad_type para o waypoint type
		const waypointType = waypointTypeMapping[adTypeValue] !== undefined ? waypointTypeMapping[adTypeValue] : WaypointType.AIRPORT;
	
		// Processa as flags para operação
		let oprFlag = 0;
		if (typeOprText.includes('VFR')) {
			oprFlag |= OperationFlags.VFR;
		}
		if (typeOprText.includes('IFR')) {
			oprFlag |= OperationFlags.IFR;
		}
	
		// Processa as flags para "user" com base no typeUtil
		let userFlag = 0;
		if (xmlTypeUtil.includes("PUB")) {
			userFlag |= UserFlags.PUB;
		}
		if (xmlTypeUtil.includes("PRIV")) {
			userFlag |= UserFlags.PRIV;
		}
		if (xmlTypeUtil.includes("MIL")) {
			userFlag |= UserFlags.MIL;
		}
	
		// Monta o objeto waypoint com os dados extraídos, usando somente "type" e "user" (flags)
		const waypoint = {
			type: waypointType,  // AIRPORT, HELIPOINT ou HELIDECK conforme o valor lido do XML
			oper: oprFlag,       // Flags de operação: VFR e/ou IFR
			user: userFlag,      // Flags do typeUtil (PRIV, PUB, MIL)
			ident: aeroCodeTag.textContent.trim(),
			name: nameTag.textContent.trim(),
			city: cityTag.textContent.trim(),
			uf: ufTag.textContent.trim(),
			lat: parseFloat(latTag.textContent),
			lng: parseFloat(lngTag.textContent),
			altFt: parseFloat(altFtTag.textContent)
		};
	
		return waypoint;
	} catch (error) {
		console.error("Erro ao buscar informações do aeroporto:", error);
		return null;
	}
}

async function getFixes(ident) {
	//const url = `${BASE_URL_ROTAER}apiKey=${API_KEY}&apiPass=${API_PASS}&area=waypoints&ident=${ident}`;
	const url = `https://api.decea.mil.br/aisweb/?apiKey=2025912383&apiPass=e8a8940a-7120-11ee-a2b8-0050569ac2e1&area=waypoints&ident=${ident}`;

	try {
		const response = await fetch(url);
		const xmlStr = await response.text();
		const xmlDoc = new DOMParser().parseFromString(xmlStr, "text/xml");

		// Verifica se os elementos principais existem
		const idTag = xmlDoc.querySelector("id");
		const identTag = xmlDoc.querySelector("ident");
		const latTag = xmlDoc.querySelector("latitude");
		const lngTag = xmlDoc.querySelector("longitude");
		const dtTag = xmlDoc.querySelector("dt");

		if (!idTag || !identTag || !latTag || !lngTag || !dtTag) {
			//alert("Fixes is NULL");
			return null;
		}

		// Monta o objeto waypoint com os dados extraídos
		const waypoint = {
			type: WaypointType.FIXES, 			// waypoint tipo FIXO
			oper: 0,							// Flags de operação: VFR e/ou IFR
			user: 0,      						// Flags do typeUtil (PRIV, PUB, MIL)
			ident: identTag.textContent.trim(),
			name: identTag.textContent.trim(),
			city: "",
			uf: "",
			lat: parseFloat(latTag.textContent),
			lng: parseFloat(lngTag.textContent),
			altFt: 0
		};

		return waypoint;
	} catch (error) {
		console.error("Erro ao buscar informações do waypoint:", error);
		return null;
	}
}
  

/**
 * Verifica se o waypoint está no formato ggmmssN/SgggmmssE/W
 * Ex: 061614S0392321W => 06°16'14"S, 039°23'21"W
 * Retorna { lat, lng } em graus decimais ou null se não casar
 */
function parseCoord(value) {
	// Regex: 2 digitos lat grau, 2 min, 2 seg, N/S
	//        3 digitos lon grau, 2 min, 2 seg, E/W
	// Exemplo: 061614S0392321W
	const regex = /^(\d{2})(\d{2})(\d{2})([NS])(\d{3})(\d{2})(\d{2})([EW])$/;
	const match = value.match(regex);

	if (!match) {
		return null;
	}

	const [
		,
		latDegStr,
		latMinStr,
		latSecStr,
		latNS,
		lonDegStr,
		lonMinStr,
		lonSecStr,
		lonEW
	] = match;

	const latDeg = parseInt(latDegStr, 10);
	const latMin = parseInt(latMinStr, 10);
	const latSec = parseInt(latSecStr, 10);

	const lonDeg = parseInt(lonDegStr, 10);
	const lonMin = parseInt(lonMinStr, 10);
	const lonSec = parseInt(lonSecStr, 10);

	// Converte para graus decimais
	let lat = latDeg + latMin / 60 + latSec / 3600;
	let lng = lonDeg + lonMin / 60 + lonSec / 3600;

	// Aplica sinal
	if (latNS === "S") {
		lat = -lat;
	}
	if (lonEW === "W") {
		lng = -lng;
	}

	return { lat, lng };
}

/**
 * Verifica se a string é uma coordenada ou um ICAO.
 * Se for coordenada, retorna um objeto "waypoint" com:
 *   ident: "User Point",
 *   name: "",
 *   city: "",
 *   uf: "",
 *   lat: latitude calculada,
 *   lng: longitude calculada,
 *   altFt: 0.
 * Se não for coordenada, busca os dados via getAirport(icao).
 * Retorna null se não conseguir achar os dados.
 */
async function getWaypoint(value) { 
	// Tenta parsear como coordenada
	const coord = parseCoord(value);
	if (coord) {
	  return {
		type: WaypointType.USER, 			// waypoint tipo User Point
		oper: 0,							// Flags de operação: VFR e/ou IFR
		user: 0,      						// Flags do typeUtil (PRIV, PUB, MIL)
		ident: "User Point",
		name: "",
		city: "",
		uf: "",
		lat: coord.lat,
		lng: coord.lng,
		altFt: 0
	  };
	} else {
	  // Se não for, tentamos como ICAO
	  let waypoint = await getAirport(value);
	  if (waypoint === null) {
		waypoint = await getFixes(value);
	  }
	  return waypoint; // pode ser null se falhar
	}
  }
  
  

/**
 * Calcula a distância em quilômetros usando a fórmula de Haversine
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distância em km
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
	const R = 6371; // Raio da Terra em km
	const φ1 = (lat1 * Math.PI) / 180;
	const φ2 = (lat2 * Math.PI) / 180;
	const Δφ = ((lat2 - lat1) * Math.PI) / 180;
	const Δλ = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) ** 2 +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

	return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calcula o rumo aproximado (0-359º) sem variação magnética
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {string} heading em graus + "º"
 */
function calcHeading(lat1, lon1, lat2, lon2) {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
    const x =
        Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
        Math.sin((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.cos(dLon);

    let brng = Math.atan2(y, x);
    brng = (brng * 180) / Math.PI;
    brng = (brng + 360) % 360;
	
    //return brng.toFixed(0) + "º"; // Retorna como string sem casas decimais e com sinal º
	return brng;  // Retorna como numero
}

/**
 * Converte minutos para string HH:MM
 * @param {number} totalMin
 * @returns {string} ex: "01:35"
 */
function convertMinToHHMM(totalMin) {
	const hh = Math.floor(totalMin / 60);
	const mm = Math.floor(totalMin % 60);
	return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
}
