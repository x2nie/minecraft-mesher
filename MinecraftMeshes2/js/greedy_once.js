// The MIT License (MIT)
//
// Copyright (c) 2012-2013 Mikola Lysenko
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.


// var GreedyMesh = (function() {
// //Cache buffer internally
// var mask = new Int32Array(4096);

function drawVertices(a) {
    var t = {}
    for (var i = 0; i < a.length; i++) {
        const [x, y, z] = a[i]
        t[i] = {
            x,
            y,
            z
        }
        t[i] = JSON.stringify(a[i])
    }
    console.table(t, ['vertice #', 'x', 'y', 'z'])
}

function drawTable(a, x, y) {
    var t = []
    for (var i = 0; i < y; i++) {
        t.push(Array.from(a.slice(i * x, (i + 1) * x)))
    }
    console.table(t)
}
console.log('coba table')
// drawTable([1,2,3,4,5,6], 2, 3)
drawTable(new Int32Array([1, 2, 3, 4, 5, 6]), 2, 3)

function GreedyX(volume, dims) {
    return Greedy(volume, dims, 0, 1)
}

function GreedyY(volume, dims) {
    return Greedy(volume, dims, 1, 2)
}

function GreedyZ(volume, dims) {
    return Greedy(volume, dims, 2, 3)
}


function Greedy(volume, dims, start, finish) {
    console.clear()
    const bold = "font-weight:bold; background:yellow;";
    const normal = "font-weight: normal";

    function f(i, j, k) {
        return volume[i + dims[0] * (j + dims[1] * k)];
    }
    const xyz = 'XYZ'
    //Sweep over 3-axes
    var vertices = [],
        faces = [];
    for (var d = start; d < finish; ++d) {
        var i, j, k, l, w, h, 
            u = (d + 1) % 3,
            v = (d + 2) % 3,
            X = xyz[d],
            Y = xyz[u],
            Z = xyz[v],
            x = [0, 0, 0],
            q = [0, 0, 0];
        // if(mask.length < dims[u] * dims[v]) {
        const mask = new Int32Array(dims[u] * dims[v]);
        // }
        console.log(`mask: ${dims[u]} x ${dims[v]}`)
        q[d] = 1;
        for (x[d] = -1; x[d] < dims[d];) {
            // console.log('x[d]=',x[d])
            console.log(`%c${X} = ${x[d]}%c`, bold, normal)
            //Compute mask
            var n = 0;
            for     (x[v] = 0; x[v] < dims[v]; ++x[v])
                for (x[u] = 0; x[u] < dims[u]; ++x[u], ++n) {
                    var a = (0 <= x[d] ? f(x[0], x[1], x[2]) : 0),
                        b = (x[d] < dims[d] - 1 ? f(x[0] + q[0], x[1] + q[1], x[2] + q[2]) : 0);
                    if ((!!a) === (!!b)) {
                        mask[n] = 0;
                    } else if (!!a) {
                        mask[n] = a;
                    } else {
                        mask[n] = -b;
                    }
                }
            drawTable(mask, dims[u], dims[v])
                //Increment x[d]
                ++x[d];
            //Generate mesh for mask using lexicographic ordering
            n = 0;
            for     (j = 0; j < dims[v]; ++j)
                for (i = 0; i < dims[u];) {
                    var c = mask[n];
                    if (!!c) {
                        //Compute width
                        for (w = 1; c === mask[n + w] && i + w < dims[u]; ++w) {}
                        //Compute height (this is slightly awkward
                        var done = false;
                        for (h = 1; j + h < dims[v]; ++h) {
                            for (k = 0; k < w; ++k) {
                                if (c !== mask[n + k + h * dims[u]]) {
                                    done = true;
                                    break;
                                }
                            }
                            if (done) {
                                break;
                            }
                        }
                        //Add quad
                        x[u] = i;
                        x[v] = j;
                        var du = [0, 0, 0],
                            dv = [0, 0, 0];
                        if (c > 0) {
                            dv[v] = h;
                            du[u] = w;
                        } else {
                            c = -c;
                            du[v] = h;
                            dv[u] = w;
                        }
                        var vertex_count = vertices.length;
                        var tvertices = []
                        tvertices.push([x[0],             x[1],             x[2]            ]);
                        tvertices.push([x[0]+du[0],       x[1]+du[1],       x[2]+du[2]      ]);
                        tvertices.push([x[0]+du[0]+dv[0], x[1]+du[1]+dv[1], x[2]+du[2]+dv[2]]);
                        tvertices.push([x[0]      +dv[0], x[1]      +dv[1], x[2]      +dv[2]]);
                        // drawTable(tvertices,3,4)
                        //   console.log(`quads: i:${i}  j:${j}`)
                        console.log(`quads: ${Y}:${i}  ${Z}:${j}`)
                        //  console.table([tvertices])
                        drawVertices(tvertices)

                        vertices.push(...tvertices)
                        faces.push([vertex_count, vertex_count + 1, vertex_count + 2, vertex_count + 3, c]);

                        //Zero-out mask
                        for     (l = 0; l < h; ++l)
                            for (k = 0; k < w; ++k) {
                                mask[n + k + l * dims[u]] = 0;
                            }
                        //Increment counters and continue
                        i += w;
                        n += w;
                    } else {
                        ++i;
                        ++n;
                    }
                }
        }
    }
    return {
        vertices,
        faces
    };
}


// if(exports) {
//   exports.mesher = GreedyMesh;
// }