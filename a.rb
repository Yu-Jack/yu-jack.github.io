require 'benchmark'

mutex = Mutex.new

Benchmark.bm do |x|
  x.report('w/o') do
    items = []
    10_000_000.times{ items << 1 }
    puts "\n item length: #{items.length}"
  end

  x.report('with') do
    items = []
    a = Thread.new{ 
        mutex.synchronize {
            5_000_000.times{ items << 1 } 
        }
    }
    b = Thread.new{ 
        mutex.synchronize {
            5_000_000.times{ items << 1 } 
        }
    }
    a.join
    b.join
    puts "\n item length: #{items.length}"
  end
end