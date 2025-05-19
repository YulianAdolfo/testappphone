let callButton = document.getElementById('call-button');
let server_connection_list = '';
let ID_connection = '';
let audio_from_device = '';
let type_of_device = '';
let id_device_one = '682a9ed08960c979a59c8b00';
let id_device_second = '682a9efd8a456b7966a0cbaf';
let peer = "";
let AUDIO_STREAM = "";
let ID_TO_CALL = "";
type_of_device = '' // device second is family, device one means father

const SEARCHING_SERVERS = 'Buscando servidores...';
const ERROR_GETTING_STUN_SERVERS = 'Hubo un error al obtener lista de sevidores';
const PUT = "PUT";
const GET = "GET";
const UPDATED = "Identificador actualizado";
const WRONG = "Algo salió mal";
const API_KEY = '$2a$10$Q7DJHOg94P.05Ys5efXsgOYcGR42EHFiJeDWxjCpgDYww2les.i0u';

let typeDevice = prompt("type: ");
if(typeDevice == "1") {
    type_of_device = "device_one"
}else {
    type_of_device = "device_second"
}

async function getConnectionID() {
    console.log('connecting...');
    console.log("connection " + server_connection_list)
    console.log("connection " + typeof server_connection_list)
    peer = await new Peer({ config: { 'iceServers': server_connection_list } });
    await peer.on('open', function (id) {
        ID_connection = id;
        console.log('ID connectado: ' + ID_connection);

        if (type_of_device == 'device_one') {

            localStorage.setItem('device_one', ID_connection);
            DataID(ID_connection, id_device_one, PUT);

        } else {

            localStorage.setItem('device_second', ID_connection);
            DataID(localStorage.getItem('device_second'), id_device_second, PUT);

        }

        peer.on('connection', function(connection) {
            console.log("Alguien quiere conectarse");
            connection.on('open', ()=> {
                connection.on('data', (data)=> {
                    console.log('recibido ', data)
                })
                connection.send('Contestado')
            })
        });

        peer.on('call', (call) => {
            console.log("Recibiendo llamada");
            call.answer(AUDIO_STREAM);       
            call.on('stream', (remoteStream) => {
                const audio = new Audio();
                audio.srcObject = remoteStream;
                audio.play();
            });
        });

    });
}

async function servers() {
    try {
        const data = await fetch('https://servers-gamma.vercel.app/');
        return await data.json();
    } catch (err) {
        return alert(ERROR_GETTING_STUN_SERVERS, err);
    }
}

async function startConnectionPeer() {
    console.log(SEARCHING_SERVERS);
    server_connection_list = await servers();
    console.log('encontrados: ' + server_connection_list);
    getConnectionID();
}
async function DataID(id, device, method) {
    let data = {id: id};
    const response = await fetch('https://api.jsonbin.io/v3/b/'+device, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY
        },
        body: JSON.stringify(data)
    });
    const result = await response.json();
    if(result.metadata.parentId) {
        console.log(UPDATED)
    }else {
        console.log(WRONG)
    }
}

async function GetDataID(id) {
    const response = await fetch('https://api.jsonbin.io/v3/b/'+id, {
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY
        },
    });
    const result = await response.json();
    ID_TO_CALL = result;
}
// To call
callButton.onclick = async () => {
    console.log("Obteniendo ID");
    if(type_of_device == "device_one") {
        await GetDataID(id_device_second);
        console.log(ID_TO_CALL.record.id);
    }else {
        await GetDataID(id_device_one);
        console.log(ID_TO_CALL.record.id);
    }
    let connection = peer.connect(ID_TO_CALL.record.id);
    connection.on('open', ()=> {
        connection.on('data', (data)=> {
            console.log('recibido ', data)
        })
        connection.send('Contestado')
    })

    const call = peer.call(ID_TO_CALL.record.id, AUDIO_STREAM);

    call.on('stream', (remoteStream) => {
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play();
    });

    call.on('error', (err) => {
        console.error("Error en la llamada:", err);
    });
}
navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    AUDIO_STREAM = stream;
}).catch( () => {
    console.error(WRONG, error);
}); 

startConnectionPeer();