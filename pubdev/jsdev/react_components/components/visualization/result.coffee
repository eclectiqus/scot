Utils = require './utils'
Revl = require './revl'

err = (x) -> new Result.Error x
wrap = (x) -> new Result.Ok x
unwrap = (x) -> x.content

Result = 
    err: err
    wrap: wrap
    unwrap: unwrap
    Ok: class Ok
        constructor: (@content) ->
        map: (fn) -> fn @content
        and_then: (fn) -> wrap (fn @content)
        map_err: () -> @
        is_ok: () -> true
        is_err: () -> false
    
    Error: class Error
        constructor: (@content) ->
        map: () -> @
        and_then: () -> @
        map_err: (fn) -> fn @content
        is_ok: () -> false
        is_err: () -> true

# get http://good.stuff/json \ (itm)->{ip: itm.ip, ct: itm.count} \ grid \ eachpoly (p) -> p.color = Utils.heatColor itm.count, maxcount \ draw
# 
ResultPromise = class ResultPromise
    constructor: () ->
        @complete = false
        @error = false
        @content = undefined
        @next = undefined
        @success = @__defaultsuccess
        @failure = @__defaultfailure
    fulfill: (content) ->
        if @complete or @error
            return
        @complete = true
        @content = content
        @success content
        @onProgress 1,1
    fail: (content) ->
        if @complete or @error
            return
        @error = true
        @content = content
        @failure content
    progress: (handler) ->
        @progressHandler = handler
        @onProgress 0,1
        @
    __defaultsuccess: (content) -> @next?.fulfill content
    __defaultfailure: (content) -> @next?.fail content

    onProgress: (done,total) ->
        @progressHandler? done,total
        @next?.onProgress done,total
        
    map: (fn) ->
        @next = new ResultPromise
        @success = (result) =>
            @next.fulfill (fn result)
        if @complete
            @success @content
        @next
        
    map_err: (fn) ->
        @next = new ResultPromise
        @failure = (result) ->
            @next.fail (fn result)
        if @error
            @failure @content
        @next
        
    @wait: (p,timeout=60) ->
        Utils = require './utils'
        if p instanceof ResultPromise
            p
        else
            ResultPromise.waitreplace p,timeout
            
    @waitall: (ps,timeout) ->
        result = new ResultPromise
        values = (null for p in ps)
        count = ps.length
        timer = undefined
        resetTimeout = ()->
            clearTimeout timer
            timer = setTimeout (()->
                console.log "Fulfilling promise with partial result. Last result was more than 10 seconds ago."
                result.fulfill (values.filter (v)->v != null)),
                timeout*1000
 
        update = (d,n)->
            console.log "Assign promised result number "+n
            values[n] = d
            count--
            if count == 0
                clearTimeout timer
                result.fulfill values
                
        updatemaker = (n)->
            (d)->
                update d,n
                resetTimeout()
            
        for i in [0...ps.length]
            n=i+0
            ps[i].map (updatemaker n)
        result

    @waitreplace: (mixed,timeout) ->
        result=new ResultPromise
        totalholes=0
        holes=0
        timer=undefined
        resetTimeout = ()->
            clearTimeout timer
            timer = setTimeout (()->
                console.log "Promise timed out, making partial fulfillment"
                result.fulfill mixed),
                timeout*1000
                
        update = (object,key,value,hole) ->
            console.log "filled hole #{hole}, #{holes} remaining"
            object[key]=value
            holes--
            result.onProgress (totalholes-holes),totalholes
            if holes==0
                clearTimeout timer
                result.fulfill mixed
                console.log "Revl: ",Revl
            
        updatemaker = (object,key,hole) ->
            (val)->
                update object,key,val,hole
                resetTimeout()
            
        replacer = (subitem)->
            for own part,promise of subitem
                if promise instanceof ResultPromise
                    promise.map (updatemaker subitem,part,holes++)
                    totalholes++
                else if (Utils.isArray promise) or (Utils.isObject promise)
                    replacer promise
        replacer mixed
        if holes == 0
            result.fulfill mixed
        result
        
    @commands:
        help__wait: ()->"""
            wait [timeout]

            If you have run a command that will return a set of
            promises, this command will wait until all of them have
            been fulfilled, then continue the command pipeline with a
            list of the resulting values.

            Timeout is an optional number of seconds to wait before
            returning an incomplete result. The timer will be reset to
            the full timeout after each successful completion, so
            think of this as saying "Wait as long as it takes while
            stuff is happening, but when there has been a long lag
            between updates, go ahead and just call it done." Note
            that this result will have unfulfilled promise instances
            sprinkled through it, so you will have to filter them out
            if later pipeline elements can't deal with them.

            Example:
                $ get "https://a.com/event_ids" \\ (id)->Http.asyncjson "GET",("https://a.com/event/"+id) \\ wait
                [list of events]

            Http.asyncjson returns a promise that will be fulfilled
            when the server responds to the query. This command will
            wait on one promise or a list of promises, and fulfill its
            own promise when they are all completed.
            """

        wait: (argv, data, ctx) ->
            if argv.length > 0
                Utils.parsevalue (argv.join ' '),ctx
                    .map_err (e) -> Result.err ('ResultPromise: '+e)
                    .map (timeout) ->
                        ResultPromise.wait data,timeout
            else
                ResultPromise.wait data
 
module.exports =
        Result: Result
        ResultPromise: ResultPromise
