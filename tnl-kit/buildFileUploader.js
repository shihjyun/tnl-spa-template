#!/usr/bin/env node
const { program } = require('commander');
const { exec } = require('child_process');

const defaultProjectPath = __dirname.split('/')
const defaultProjectName = defaultProjectPath[defaultProjectPath.length - 2]

// upload command
program
  .version('0.0.1')
  .command('upload [project]')
  .description('upload build files to GCS')
  .action(uploadBuildFileToGCS)


program.parse(process.argv);


function uploadBuildFileToGCS(project){

  const finalProjectName = project ? project : defaultProjectName
  // tnl graphic bucket
  const destinationBucket = 'gs://datastore.thenewslens.com/infographic/' + finalProjectName + '/'
  // build files need to upload
  const buildFileDirectories = ['./public/build/bundle.css', './public/build/bundle.js', './public/index.css']
  // paste full cli let gsutil upload the single files
  const fullCommandLine = (filePath) => `gsutil cp ${filePath} ${destinationBucket}`
  
  buildFileDirectories.forEach((file) => {
    exec(fullCommandLine(file), (error, stdout, stderr) => {
      console.log(`${stdout}`);
      console.log(`${stderr}`);
      if (error !== null) {
          console.log(`exec error: ${error}`);
      }
    })
  })
}

  

