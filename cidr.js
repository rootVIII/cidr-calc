/*  https://github.com/rootVIII/cidr-calc  */

/*
// hex values okay as well or int
let x = new Uint8Array(Uint8Array.from([255, 32, 68,  17]));
let dv = new DataView(x.buffer)
console.log((dv.getInt32(0) >>> 0).toString(16))
*/

class CidrCalc {
    constructor(ip, cidrMask) {
        this.ip = new Uint8Array(Uint8Array.from(ip));
        this.cidrMask = new Uint8Array(Uint8Array.from([cidrMask]));
        this.networkAddress = new Uint8Array(4);
        this.broadcastAddress = new Uint8Array(4);
        this.subnetMask = new Uint8Array(4);
        this.wildcardMask = new Uint8Array(4);
        this.subnetBitmap = '';
        this.onBits = this.offBits = 0x00;
        this.hostsMax = 0;
    }

    setSubnetMask(shiftU32ToU8Array) {
        const trailing = 0x20 - new DataView(this.cidrMask.buffer).getUint8(0);
        const mask = (((0xFFFFFFFF >> trailing) << trailing) >>> 0);

        const maskBytesArray = shiftU32ToU8Array(mask);
        for (let index = 0; index < maskBytesArray.length; index++) {
            this.subnetMask[index] = maskBytesArray[index];
        }
    }

    setMaxHosts() {
        this.hostsMax = 1 << this.offBits;
        if (new DataView(this.cidrMask.buffer).getUint8(0) !== 0x20) {
            this.hostsMax -= 2;
        }
    }

    setSubnetBitmap() {
        return new Promise((resolve) => {
            let i = 0;
            for (; i < this.onBits; i++) {
                this.subnetBitmap += 'n';
            }
            for (i = 0; i < this.offBits; i++) {
                this.subnetBitmap += 'h';
            }
            resolve(null);
        });
    }

    setNeworkID(shiftU32ToU8Array) {
        return new Promise((resolve) => {
            const uint32Ip = new DataView(this.ip.buffer).getUint32(0);
            const uint32Subnet = new DataView(this.subnetMask.buffer).getUint32(0);
            const netAddr = (uint32Ip & uint32Subnet) >>> 0;
            const uint32NetAddr = shiftU32ToU8Array(netAddr);
            for (let index = 0; index < 4; index++) {
                this.networkAddress[index] = uint32NetAddr[index];
            }
            const uint32BroadcastAddr = shiftU32ToU8Array(netAddr + this.hostsMax + 1);
            for (let index = 0; index < 4; index++) {
                this.broadcastAddress[index] = uint32BroadcastAddr[index];
            }
            resolve(null);
        });
    }

    setWildcard(shiftU32ToU8Array) {
        return new Promise((resolve) => {
            const uint32SubnetMask = new DataView(this.subnetMask.buffer).getUint32(0);
            const wildcard = shiftU32ToU8Array(~uint32SubnetMask >>> 0);
            for (let index = 0; index < 4; index++) {
                this.wildcardMask[index] = wildcard[index];
            }
            resolve(null);
        });
    }

    getResults() {
        return {
            networkAddrUInt32: this.networkAddress,
            networkAddr: this.networkAddress,
            broadcastAddrUInt32: this.broadcastAddress,
            broadcastAddr: this.broadcastAddress,
            subnetMaskUInt32: this.subnetMask,
            subnetMask: this.subnetMask,
            subnetBitmap: this.subnetBitmap,
            wildcard: this.wildcardMask,
            maxHosts: this.hostsMax,
        };
    }

    mask() {
        let shiftU32ToU8Array = (digit) => [
            0xFF & (digit >> 24),
            0xFF & (digit >> 16),
            0xFF & (digit >> 8),
            0xFF & digit,
        ];
        this.setSubnetMask(shiftU32ToU8Array);
        const binRepr = new DataView(this.subnetMask.buffer).getUint32(0);
        this.onBits = Math.clz32(~binRepr);
        this.offBits = 0x20 - this.onBits;
        this.setMaxHosts();

        return Promise.all([
            this.setSubnetBitmap(),
            this.setWildcard(shiftU32ToU8Array),
            this.setNeworkID(shiftU32ToU8Array),
        ]).then(() => this.getResults());
    }
}

// eslint-disable-next-line no-unused-vars
function clearForm() {
    document.getElementById('statusMessage').innerHTML = '&thinsp;';
    for (let field of document.getElementsByTagName('input')) {
        if (field.id !== 'cidrBlock') {
            field.value = '';
        }
    }
}

// eslint-disable-next-line no-unused-vars
function validateInput(address, cidrPrefix) {
    if (!(address) || (!(cidrPrefix))) {
        throw new Error('Invalid CIDR provided');
    }
    if (address.includes(' ')) {
        throw new Error('CIDR may not contain spaces');
    }
    const octets = address.split('.');
    if (octets.length !== 4 || !(/^\d+$/.test(cidrPrefix))) {
        throw new Error('Invalid CIDR');
    }
    const net = parseInt(cidrPrefix, 10);
    if (net < 0x00 || net > 0x20) {
        throw new Error(`invalid CIDR prefix provided: /${cidrPrefix}`);
    }
    for (let index = 0; index < octets.length; index++) {
        const value = parseInt(octets[index], 10);
        if (!(/^\d+$/.test(value.toString())) || value < 0x00 || value > 0xFF) {
            throw new Error(`invalid octet found: ${octets[index]}`);
        }
        octets[index] = value;
    }

    return octets;
}

// eslint-disable-next-line no-unused-vars
function calculateCIDR() {
    const cidr = document.getElementById('cidrBlock').value;
    const addr = cidr.split('/');
    let argErr = null;
    let ipOctets;
    try {
        ipOctets = validateInput(...addr);
    } catch (err) {
        document.getElementById('statusMessage').innerHTML = err;
        argErr = err;
        setTimeout(() => {
            document.getElementById('statusMessage').innerHTML = '&thinsp;';
        }, 4000);
    }

    if (!(argErr)) {
        const cidrCalc = new CidrCalc(ipOctets, parseInt(addr[1], 10));
        cidrCalc.mask().then((results) => {
            console.log(results);
        }).catch((err) => {
            console.log(err);
        });
    }
}
