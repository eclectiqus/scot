// Generated by CoffeeScript 1.11.1
(function() {
  var Edge, Vec;

  Vec = require('./vec');

  Edge = (function() {
    function Edge(p11, p21) {
      this.p1 = p11;
      this.p2 = p21;
    }

    Edge.prototype.norm = function() {
      return (this.p2.sub(this.p1)).norm();
    };

    Edge.prototype.crosses = function(edge) {
      return ((edge.p1.edgetest(this)) !== edge.p2.edgetest(this)) && ((this.p1.edgetest(edge)) !== this.p2.edgetest(edge));
    };

    Edge.prototype.contains = function(pt) {
      var me, ratio, v1;
      v1 = pt.sub(this.p1);
      me = this.p2.sub(this.p1);
      ratio = (v1.nth(0)) / (me.nth(0));
      return (flte(0, ratio)) && (flte(ratio, 1)) && (me.scale(ratio)).eq(v1);
    };

    Edge.prototype.direction = function() {
      return this.p2.sub(this.p1);
    };

    Edge.prototype.parallel = function(edge) {
      return feq(1, this.direction().normalize().dot(edge.direction().normalize()));
    };

    Edge.prototype.intersection = function(edge) {
      var denom, n1, n2, p1, p2, ref, ref1, x1, x2, x3, x4, y1, y2, y3, y4;
      if (this.parallel(edge)) {
        return void 0;
      }
      ref = [this.p1.nth(0), this.p1.nth(1), this.p2.nth(0), this.p2.nth(1)], x1 = ref[0], y1 = ref[1], x2 = ref[2], y2 = ref[3];
      ref1 = [edge.p1.nth(0), edge.p1.nth(1), edge.p2.nth(0), edge.p2.nth(1)], x3 = ref1[0], y3 = ref1[1], x4 = ref1[2], y4 = ref1[3];
      denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      n1 = x1 * y2 - y1 * x2;
      n2 = x3 * y4 - y3 * x4;
      p1 = (n1 * (x3 - x4) - (x1 - x2) * n2) / denom;
      p2 = (n1 * (y3 - y4) - (y1 - y2) * n2) / denom;
      return new Vec([p1, p2]);
    };

    return Edge;

  })();

  module.exports = Edge;

}).call(this);

//# sourceMappingURL=edge.js.map
