use std::path::PathBuf;
use std::fs::{self, File, metadata};
use std::io::Write;
use std::io::{Error, ErrorKind};

use bookconfig::BookConfig;

pub struct MDBook {
    path: PathBuf,
    config: BookConfig,
}

impl MDBook {

    pub fn new(path: &PathBuf) -> Self {

        // Hacky way to check if the path exists... Until PathExt moves to stable
        match metadata(path) {
            Err(_) => panic!("Directory does not exist"),
            Ok(f) => {
                if !f.is_dir() {
                    panic!("Is not a directory");
                }
            }
        }

        MDBook {
            path: path.to_owned(),
            config: BookConfig::new(),
        }
    }

    pub fn init(&self) -> Result<(), Error> {

        // Logic problem: When self.dest is absolute, the directory given
        // as parameter is never used...
        let dest = self.path.join(&self.config.dest());

        let src = self.path.join(&self.config.src());

        // Hacky way to check if the directory exists... Until PathExt moves to stable
        match metadata(&dest) {
            Err(_) => {
                // There is a very high chance that the error is due to the fact that
                // the directory / file does not exist
                fs::create_dir(&dest).unwrap();
            },
            Ok(_) => { /* If there is no error, the directory / file does exist */ }
        }

        // Hacky way to check if the directory exists... Until PathExt moves to stable
        match metadata(&src) {
            Err(_) => {
                // There is a very high chance that the error is due to the fact that
                // the directory / file does not exist
                fs::create_dir(&src).unwrap();
            },
            Ok(_) => { /* If there is no error, the directory / file does exist */ }
        }

        // Hacky way to check if the directory exists... Until PathExt moves to stable
        let summary = match metadata(&src.join("SUMMARY.md")) {
            Err(_) => {
                // There is a very high chance that the error is due to the fact that
                // the directory / file does not exist
                Result::Ok(File::create(&src.join("SUMMARY.md")).unwrap())
            },
            Ok(_) => {
                /* If there is no error, the directory / file does exist */
                Result::Err("SUMMARY.md does already exist")
            }
        };

        if let Ok(mut f) = summary {
            try!(writeln!(f, "# Summary"));
            try!(writeln!(f, ""));
            try!(writeln!(f, "[Chapter 1](./chapter_1.md)"));

            let mut chapter_1 = File::create(&src.join("chapter_1.md")).unwrap();
            try!(writeln!(chapter_1, "# Chapter 1"));
        }

        return Ok(());
    }

    pub fn build(&self, dir: &PathBuf) -> Result<(), Error> {



        Ok(())
    }

    pub fn set_dest(mut self, dest: PathBuf) -> Self {
        self.config.set_dest(dest);
        self
    }

    pub fn set_src(mut self, src: PathBuf) -> Self {
        self.config.set_src(src);
        self
    }

}
