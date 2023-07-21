mod utils;

extern crate fixedbitset;
extern crate rand;

use fixedbitset::FixedBitSet;
use rand::prelude::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Universe {
    span: u32,
    cells: FixedBitSet,
}

#[wasm_bindgen]
impl Universe {
    pub fn new() -> Universe {
        let span = 200 as u32;
        let size = (2 * span + 1) as usize;
        let mut cells = FixedBitSet::with_capacity(size);

        for i in 0..size as usize {
            cells.set(i, false);
        }
        let midpoint = (span + 1) as usize;
        cells.set(midpoint, true);

        Universe {
            span,
            cells,
        }
    }

    pub fn span(&self) -> u32 {
        self.span
    }

    pub fn set_span(&mut self, span: u32) {
        self.span = span;

        let size = (2 * span + 1) as usize;
        self.cells = FixedBitSet::with_capacity(size);

        let midpoint = (span + 1) as usize;
        self.cells.set(midpoint, true);
    }

    pub fn cells(&self) -> *const u32 {
        self.cells.as_slice().as_ptr()
    }

    pub fn count_active(&self) -> u32 {
        self.cells.count_ones(..) as u32
    }

    pub fn tick(&mut self, pattern: &Pattern) {
        let width = (2 * self.span + 1) as usize;
        let mut carry_over = self.cells[width-1];
        let start = self.cells[0];

        for j in 0..width {
            let k = if j == width - 1 { start } else { self.cells[j + 1] };

            let outcome = pattern.outcome(carry_over, self.cells[j], k);

            carry_over = self.cells[j];
            self.cells.set(j, outcome);
        }
    }

    pub fn randomize(&mut self) {
        let width = (2 * self.span + 1) as usize;

        for i in 0..width {
            self.cells.set(i, random());
        }
    }
}

#[wasm_bindgen]
pub struct Pattern {
    outcomes: FixedBitSet,
}

#[wasm_bindgen]
impl Pattern {
    pub fn new() -> Pattern {
        let mut outcomes = FixedBitSet::with_capacity(8);

        outcomes.set(0, false);
        outcomes.set(1, true);
        outcomes.set(2, true);
        outcomes.set(3, true);
        outcomes.set(4, true);
        outcomes.set(5, true);
        outcomes.set(6, true);
        outcomes.set(7, true);

        Pattern {
            outcomes,
        }
    }

    pub fn outcome(&self, i: bool, j: bool, k: bool) -> bool {
        match(i, j, k) {
            (false, false, false) => self.outcomes[0],
            (false, false,  true) => self.outcomes[1],
            (false,  true, false) => self.outcomes[2],
            (false,  true,  true) => self.outcomes[3],
            ( true, false, false) => self.outcomes[4],
            ( true, false,  true) => self.outcomes[5],
            ( true,  true, false) => self.outcomes[6],
            ( true,  true,  true) => self.outcomes[7],
        }
    }

    pub fn set_outcome(&mut self, index: usize, outcome: bool) {
        self.outcomes.set(index, outcome);
    }

    pub fn get_outcome(&self, index: usize) -> bool {
        self.outcomes[index]
    }
}
