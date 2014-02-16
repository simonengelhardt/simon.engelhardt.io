$(document).foundation();

// Override LinkedIn plugin icon style (see also CSS)
IN.Event.on(IN, 'systemReady', function() {
  $('.li-connect-mark')
  .addClass('fi-social-linkedin');
});

var resumeApp = angular.module('resumeApp', []);

resumeApp.controller('ExperienceCtrl', ['$scope', 'sheets', '$log', function ($scope, sheets, $log) {
  sheets.getExperiences().then(function(experiences) {
    var dateFormat = 'MM/DD/YYYY'; // Date format from Google Sheets API
    angular.forEach(experiences, function(experience) {
      if (experience.start) experience.start = moment(experience.start, dateFormat);
      if (experience.end) {
        experience.end = moment(experience.end, dateFormat);
      }
      else {
        experience.end = moment();
        experience.current = true;
      }
      if (experience.start && experience.end) experience.duration = moment.duration(experience.end - experience.start);
    });
    $scope.experiences = experiences;
  });
}]);

resumeApp.controller('ProjectsCtrl', ['$scope', 'sheets', '$log', function ($scope, sheets, $log) {
  $scope.roles = [];
  var unfilteredRole = 'All';
  $scope.selectedRole = unfilteredRole;
  $scope.allYears = [];
  
  for(var i = 2006; i < 2014; i++) { // Could be calculated dynamically from projects
    $scope.allYears.push(i.toString());
  }

  sheets.getProjects().then(function(projects){
    $scope.projects = projects;
    angular.forEach($scope.projects, function(project){
      project.extendedDescriptionVisible = false;
      angular.forEach(project.roles, function(role){
        if ($scope.roles.indexOf(role) === -1)
          $scope.roles.push(role);
      })
    });
    $scope.roles.sort();
    $scope.roles.unshift(unfilteredRole);
  });

  $scope.roleFilter = function(project){
    return $scope.selectedRole === unfilteredRole || angular.isArray(project.roles) && project.roles.indexOf($scope.selectedRole) !== -1;
  };

  $scope.sortNumbersDesc = function(a, b) {
    return b - a;
  };
}]);

resumeApp.factory('sheets', ['$http', '$log', function($http, $log){
  var sheetUrls = {
        projects:   'https://spreadsheets.google.com/feeds/list/0ApJXKMOVLglTdE04c2Y0N192VWJQSlVzTWpicDBqbEE/1/public/values?alt=json',
        experience: 'https://spreadsheets.google.com/feeds/list/0ApJXKMOVLglTdE04c2Y0N192VWJQSlVzTWpicDBqbEE/3/public/values?alt=json'
      },
      keyPrefix = 'gsx$',
      valuePropertyName = '$t';

  // Simple mapping of all properties from Google spreadsheet columns (in format such as entry.gsx$columnname.$t)
  function mapSheet(data) {
    var objects = data.feed.entry.map(function(entry) {
      var object = {};
      
      for (key in entry) {
        if (key.indexOf(keyPrefix) === 0) {
          var value = entry[key][valuePropertyName];

          if (value.indexOf('\n') !== -1)
            value = value.split('\n');
          else
            value = value.toString();

          object[key.substring(keyPrefix.length)] = value;
        }
      }
      return object;
    });

    return objects;
  }

  return {
    getProjects: function() {
      return $http.get(sheetUrls.projects).then(function(response) {
        return mapSheet(response.data);
      });
    },
    getExperiences: function() {
      return $http.get(sheetUrls.experience).then(function(response) {
        return mapSheet(response.data);
      });
    }
  };
}]);