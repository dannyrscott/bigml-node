var assert = require('assert'),
  bigml = require('../index');

describe('Manage local cluster objects', function () {
  var sourceId, source = new bigml.Source(), path = './data/spam.csv',
    datasetId, dataset = new bigml.Dataset(), seed = 'BigML tests',
    clusterId, cluster = new bigml.Cluster(), clusterResource, clusterFinishedResource,
    localCluster, firstCentroidDistance, secondCentroidDistance;

  before(function (done) {
    var tokenMode = {'fields': {'000001': {'term_analysis': {'token_mode': 'full_terms_only'}}}},
      textField = {'fields': {'000001': {'optype': 'text'}}};
    source.create(path, undefined, function (error, data) {
      assert.equal(data.code, bigml.constants.HTTP_CREATED);
      sourceId = data.resource;
      source.get(sourceId, true, function (error, data) {
        source.update(sourceId, textField, function (error, data) {
          dataset.create(sourceId, tokenMode, function (error, data) {
            assert.equal(data.code, bigml.constants.HTTP_CREATED);
            datasetId = data.resource;
            cluster.create(datasetId, {seed: seed, cluster_seed: seed, k:8},
              function (error, data) {
                assert.equal(data.code, bigml.constants.HTTP_CREATED);
                clusterId = data.resource;
                clusterResource = data;
                cluster.get(clusterResource, true, 'only_model=true',
                  function (error, data) {
                    clusterFinishedResource = data;
                    done();
                  });
            });
          });
        });
      });
    });
  });

  describe('LocalCluster(clusterId)', function () {
    it('should create a localCluster from a cluster Id', function (done) {
      localCluster = new bigml.LocalCluster(clusterId);
      if (localCluster.ready) {
        assert.ok(true);
        done();
      } else {
        localCluster.on('ready', function () {assert.ok(true);
          done();
          });
      }
    });
  });
  describe('#centroid(inputData, callback)', function () {
    it('should predict centroids asynchronously from input data', function (done) {
      var inputData = {'Type': 'spam', "Message": "FREE for 1st week! No1 Nokia tone 4 ur mob every week just txt NOKIA to 87077 Get txting and tell ur mates. zed POBox 36504 W45WQ norm150p/tone 16+"};
      localCluster.centroid(inputData, function (error, data) {
        assert.equal(data.centroidName, 'Cluster 1');
        firstCentroidDistance = data.distance;
        var centroidName = data.centroidName;
        var centroid = new bigml.Centroid();
        centroid.create(clusterId, inputData, function (error, data) {
            assert.equal(centroidName, data.object.centroid_name);
            assert.equal(firstCentroidDistance, data.object.distance);
            centroid.delete(data.resource, function (error, data) {
              assert.equal(error, null);
              done();
            });
        });
      });
    });
  });
  describe('#centroid(inputData)', function () {
    it('should predict synchronously from input data', function (done) {
      var inputData = {'Type': 'ham', 'Message': 'Ok'};
      var prediction = localCluster.centroid(inputData);
      assert.equal(prediction.centroidName, 'Cluster 0');
      secondCentroidDistance = prediction.distance;
      var centroidName = prediction.centroidName;
      var centroid = new bigml.Centroid();
      centroid.create(clusterId, inputData, function (error, data) {
          assert.equal(centroidName, data.object.centroid_name);
          assert.equal(secondCentroidDistance, data.object.distance);
          centroid.delete(data.resource, function (error, data) {
            assert.equal(error, null);
            done();
          });
      });
    });
  });
  after(function (done) {
    source.delete(sourceId, function (error, data) {
      assert.equal(error, null);
      done();
    });
  });
  after(function (done) {
    dataset.delete(datasetId, function (error, data) {
      assert.equal(error, null);
      done();
    });
  });
  after(function (done) {
    cluster.delete(clusterId, function (error, data) {
      assert.equal(error, null);
      done();
    });
  });
});
